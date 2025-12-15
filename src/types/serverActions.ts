export interface blockData {
    mobNoEn: string;
    type: boolean;
    mobileNohashed: string;
    mobileNoEncrypted: string;
};
export interface clientData{
  name: string;
  mobileNohashed: string;
  mobileNoEncrypted: string;
  mobNoEn: string;
  type:number;
}
export interface deleteItemClent{
  mobileNoHashed:string;
  type:number;
}

export type ActionResult = "OK" | "UNAUTHORIZED" | "INVALID_INPUT" | "INTERNAL_ERROR"