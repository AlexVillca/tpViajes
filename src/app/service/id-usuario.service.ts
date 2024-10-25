import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdUsuarioSkipTestService {
  private userId: String|null = null;
  setUserId(id:string){
    this.userId = id;
  }
  getUserId(){
    return this.userId;
  }
  constructor() { }
}
