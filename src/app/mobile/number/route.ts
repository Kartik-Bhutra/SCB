import { type NextRequest, NextResponse } from "next/server";
import { client, pool } from "@/db";
import { decryptFromBuffer } from "@/hooks/crypto";
import { hashToBuffer } from "@/hooks/hash";
import { statusResponse } from "@/server/response";

interface ReqData {
    token: string;
}

export async function POST(req: NextRequest) {
    let connection;
    let reporterMobHash: Buffer | null = null;

    try {
        const { token } = (await req.json()) as ReqData;

        if (!token) {
            return NextResponse.json(
                { error: "Missing token" },
                { status: 400 }
            );
        }

        const parts = token.split(".");
        if (parts.length !== 2) {
            return NextResponse.json(
                { status: "invalid session" },
                { status: 401 }
            );
        }

        const [redisKey, session] = parts;
        const cached = await client.get(redisKey);

        if (cached) {
            const parsed = JSON.parse(cached);

            if (parsed.session !== session) {
                return NextResponse.json(
                    { status: "invalid session" },
                    { status: 401 }
                );
            }

            if (parsed.type === 2 || parsed.type === 0) {
                return statusResponse(parsed.type);
            }

            reporterMobHash = hashToBuffer(parsed.mobileNo);
        }

        if (!reporterMobHash) {
            const keyParts = redisKey.split(":");
            if (keyParts.length !== 2) {
                return NextResponse.json(
                    { error: "Invalid token" },
                    { status: 400 }
                );
            }

            const [mobHashBase64Url, deviceId] = keyParts;
            const mobHash = Buffer.from(mobHashBase64Url, "base64url");

            connection = await pool.getConnection();

            const [rows] = (await connection.execute(
                {
                    sql: `
            SELECT type
            FROM users
            WHERE mobNoHs = ? AND devId = ?
            LIMIT 1
          `,
                    rowsAsArray: true,
                },
                [mobHash, deviceId]
            )) as unknown as [[number][]];

            if (rows.length === 0) {
                return NextResponse.json(
                    { status: "post request" },
                    { status: 200 }
                );
            }

            const [type] = rows[0];

            if (type === 2 || type === 0) {
                return statusResponse(type);
            }

            reporterMobHash = mobHash;
        }

        if (!connection) {
            connection = await pool.getConnection();
        }

        const [rows] = (await connection.execute(
            {
                sql: `
          SELECT reported.mobNoEn, reported.type
          FROM reporter
          JOIN reported
            ON reported.mobNoHs = reporter.repNoHs
          WHERE reporter.mobNoHs = ?
        `,
                rowsAsArray: true,
            },
            [reporterMobHash]
        )) as unknown as [[Buffer, number][]];

        const reportedNumbers = rows.map(([mobNoEn, type]) => ({
            number: decryptFromBuffer(mobNoEn),
            type,
        }));

        return NextResponse.json(
            { reportedNumbers },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
