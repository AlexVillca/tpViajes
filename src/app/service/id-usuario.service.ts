import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdUsuarioService {
  private userId: String|null = null;
  setUserId(id:string){
    this.userId = id;
  }
  getUserId(){
    return this.userId;
  }
  constructor() { }
}
