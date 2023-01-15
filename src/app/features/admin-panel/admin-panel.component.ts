import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {AdminService} from "../../core/services/admin.service";
import {RolesInt} from "../../core/interfaces/rolesInt";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {UserDataInt} from "../../core/interfaces/UserDataInt";
import {debounceTime} from "rxjs";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";




@Component(
  {
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPanelComponent implements OnInit {

  constructor(private _adminService: AdminService,
              private _change: ChangeDetectorRef) {

    this.searchField.valueChanges.pipe(debounceTime(500)).subscribe((text) => {
      this._adminService.findUser({search: text}).pipe(
      ).subscribe((value ) => {
        console.log(value)
        this.dataSource = new MatTableDataSource<UserDataInt>(value.data.entities);
      });
    })
  }

  // This is for open or close to sideForm
  @Input() matDrawer_Open = true;

  selectedRoles: string[] = [];

  // This way, when the component is first loaded, it will have a default value for UserRoles and when
  // the data is loaded from the API, it will update with the new value.
  UserRoles: RolesInt = { data: { entities: [] }, success: false };

  displayedColumns: string[] = ['email', 'firstName', 'lastName', 'roles', "locked"];


  dataSource = new MatTableDataSource<UserDataInt>();




  userForm = new FormGroup({
    firstName: new FormControl("", [Validators.required]),
    lastName: new FormControl("", [Validators.required]),
    email: new FormControl("",[Validators.required]),
    userStatus: new FormControl("", [Validators.required]),
  })

  searchField = new FormControl();

  ngOnInit(): void {
    this._adminService.getRoles().subscribe(value => this.UserRoles = value)
  }

  saveUser() {
    const lockedStatus = this.userForm.value!.userStatus! === 'active';
    let userData = {
      firstName: this.userForm.value!.firstName!,
      lastName: this.userForm.value!.lastName!,
      email: this.userForm.value!.email!,
      locked: lockedStatus ,
      roles: this.selectedRoles
    }

    this._adminService.saveUser(userData);
  }

  // for remove user role
  removeRole(roles: string): void {
    const index = this.selectedRoles.indexOf(roles);

    if (index >= 0) {
      this.selectedRoles.splice(index, 1);
    }
  }
  // add new role
  addRole(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedRoles.push(value);
  }

}
