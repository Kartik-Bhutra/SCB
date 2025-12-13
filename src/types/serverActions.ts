export interface blockData {
    mobNoEn: string;
    type: boolean;
    mobileNohashed: string;
    mobileNoEncrypted: string;
};
export interface serverActionState {
  success: boolean;
  error: string;
}
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