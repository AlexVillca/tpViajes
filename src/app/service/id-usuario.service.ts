import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdUsuarioService {
  private userId: string|null =null;
  setUserId(id:string|null){
    this.userId = id;
  }
  getUserId(){
    return this.userId;
  }

  constructor() { }
}
