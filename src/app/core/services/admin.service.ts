import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {RolesInt} from "../interfaces/rolesInt";
import {UserDataInt} from "../interfaces/UserDataInt";
import {Observable} from "rxjs";
import {FindUserInt} from "../interfaces/findUserInt";



@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) {}

  public getRoles() {
    return this.http.post<RolesInt>("https://development.api.optio.ai/api/v2/reference-data/find", {
      "typeId": 4,
      "sortBy": "name",
      "sortDirection": "asc",
      "pageIndex": 0,
      "pageSize": 50,
      "includes": [
        "code", "name"
      ]
    })
  }
  // This function updates or adds new user, it's defends if id is already exists or not
  public saveUser(userData: UserDataInt): Observable<{data: UserDataInt}> {
    return this.http.post<{data: UserDataInt}>("https://development.api.optio.ai/api/v2/admin/users/save", userData);
  }
  // delete user from db
  public deleteUser(id: string): Observable<{success: boolean}>{
    return this.http.post<{success : boolean}>("https://development.api.optio.ai/api/v2/admin/users/remove", {id});
  }
  // it's searches and sorts data, then returns it
  public findUser(value: FindUserInt): Observable<{ data: { entities: UserDataInt[],  total: number } }>{
    return this.http.post<{data: {entities: UserDataInt[], total: number}}>("https://development.api.optio.ai/api/v2/admin/users/find", value);
  }

  // public findUserById(id: string){
  //   this.http.post("https://development.api.optio.ai/api/v2/admin/users/find-one", {id}, this.HTTP_OPTIONS).subscribe((value) => {
  //   })
  // }
}
