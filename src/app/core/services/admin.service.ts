import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {RolesInt} from "../interfaces/rolesInt";
import {UserDataInt} from "../interfaces/UserDataInt";
import {Observable} from "rxjs";



@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) {}
  private auth_token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImludGVybnNoaXBAb3B0aW8uYWkiLCJzdWIiOiIzOTg3NjY3MzE3MzQ4OTgzIiwiaWF0IjoxNjczNTI3NzMyLCJleHAiOjE2NzUyNTU3MzJ9.ss2VWdlLDTJYa2rOXfffwnaMJIIeEB7DwkSVsl8xcTjheFu8ATS4eoCtzP5lDYRxQSaG7JXi8FhCRFivMSkSgg\n";

  private HTTP_OPTIONS = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(this.auth_token)}`
    })
  };

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
    }, this.HTTP_OPTIONS)
  }
  // This function updates or adds new user, it's defends if id is already exists or not
  public saveUser(userData: UserDataInt): Observable<{data: UserDataInt}> {
    return this.http.post<{data: UserDataInt}>("https://development.api.optio.ai/api/v2/admin/users/save", userData, this.HTTP_OPTIONS);
  }
  // delete user from db
  public deleteUser(id: string): Observable<{success: boolean}>{
    return this.http.post<{success : boolean}>("https://development.api.optio.ai/api/v2/admin/users/remove", {id}, this.HTTP_OPTIONS);
  }
  // it's searches and sorts data, then returns it
  public findUser(value: { search: string, pageSize: number }): Observable<{ data: { entities: UserDataInt[] } }>{
    return this.http.post<{data: {entities: UserDataInt[]}}>("https://development.api.optio.ai/api/v2/admin/users/find", value, this.HTTP_OPTIONS);
  }

  public findUserById(id: string){
    this.http.post("https://development.api.optio.ai/api/v2/admin/users/find-one", {id}, this.HTTP_OPTIONS).subscribe((value) => {
    })
  }
}
