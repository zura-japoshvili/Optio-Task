import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild
} from '@angular/core';
import {AdminService} from "../../core/services/admin.service";
import {RolesInt} from "../../core/interfaces/rolesInt";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {UserDataInt} from "../../core/interfaces/UserDataInt";
import {debounceTime} from "rxjs";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatDrawer} from "@angular/material/sidenav";
import {MatSort} from "@angular/material/sort";




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
    // When using the search field, a request is generated every half second
    // and a list of users matching its value is searched.
    // If search field is empty nothing will happen
    this.searchField.valueChanges.pipe(debounceTime(500)).subscribe((text) => {
      if(text){
        this._adminService.findUser({search: text}).pipe(
        ).subscribe((value ) => {
          console.log(value)
          this.dataSource = new MatTableDataSource<UserDataInt>(value.data.entities);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this._change.detectChanges();
        });
      }
    })
  }

  // This is for open or close to sideForm
  @ViewChild('drawer', { static: true }) drawer!: MatDrawer;


  // This data is for user list and list pagination
  displayedColumns: string[] = ['email', 'firstName', 'lastName', 'roles', "locked", 'action'];
  dataSource = new MatTableDataSource<UserDataInt>([]);

  private paginator!: MatPaginator;
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
  }
  @ViewChild(MatSort) sort!: MatSort;

  // for check if update form is opened or not
  public isUpdateOpen = false;


  selectedRoles: string[] = [];
  // This way, when the component is first loaded, it will have a default value for UserRoles and when
  // the data is loaded from the API, it will update with the new value.
  UserRoles: RolesInt = { data: { entities: [] }, success: false };


  userForm = new FormGroup({
    firstName: new FormControl("", [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z]+( [a-zA-Z]+)*$/)]),
    lastName: new FormControl("", [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z]+( [a-zA-Z]+)*$/)]),
    email: new FormControl("",[Validators.required, Validators.email]),
    userStatus: new FormControl("", [Validators.required]),
  })

  // Stores an updatable user ID
  private UpUserDataId!: string;

  // Search field control
  searchField = new FormControl();

  ngOnInit(): void {
    // when component is loaded, it's automatically update user roles
    this._adminService.getRoles().subscribe(value => {
      this.UserRoles = value
      this._change.detectChanges();
    });
  }

  // save new userdata in db
  saveUser() {
    const lockedStatus = this.userForm.value!.userStatus! === 'active';
    let userData = {
      firstName: this.userForm.value!.firstName!,
      lastName: this.userForm.value!.lastName!,
      email: this.userForm.value!.email!,
      locked: lockedStatus,
      roles: this.selectedRoles
    }

    this._adminService.saveUser(userData).subscribe((value) => {

    });
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
    if (!this.selectedRoles.includes(value)){
      this.selectedRoles.push(value);
    }
  }

  // method for close or open sidebar,
  // and it's also reset User form
  public openCloseDrawer(bool: boolean) {
    this.userForm.reset();
    this.isUpdateOpen = false;

    this.selectedRoles = [];
    if (bool)
      this.drawer.open()
    else
      this.drawer.close();
  }

  setUpdatedata(data: UserDataInt){
    this.isUpdateOpen = true;
    this.UpUserDataId = data.id!;

    this.userForm.patchValue({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      userStatus: data.locked ? "active" : 'inactive'
    });

    this.selectedRoles = data.roles;
  }

  updateUserData(){
    const lockedStatus = this.userForm.value!.userStatus! === 'active';
    let userData = {
      id: this.UpUserDataId,
      firstName: this.userForm.value!.firstName!,
      lastName: this.userForm.value!.lastName!,
      email: this.userForm.value!.email!,
      locked: lockedStatus,
      roles: this.selectedRoles
    }

    this._adminService.saveUser(userData).subscribe((value) => {
      // const userToUpdate = this.dataSource.data.find(user => user.id === userData.id);
      // if(userToUpdate){
      //   userToUpdate.firstName = userData.firstName;
      //   userToUpdate.lastName = userData.lastName;
      //   userToUpdate.email = userData.email;
      //   userToUpdate.locked = userData.locked;
      //   userToUpdate.roles = userData.roles;
      //   this._change.detectChanges();
      // }

      console.log(value)
    });
  }

  deleteUser(data: UserDataInt){
    if (confirm(`Are you sure to delete ${data.firstName} ${data.lastName}`)){
      this._adminService.deleteUser(data.id!).subscribe((value) => {
        if (value.success){
          // Delete the user from the data source
          this.dataSource.data = this.dataSource.data.filter(user => user.id !== data.id);
          // Update the paginator's length and page properties
          this.paginator.length = this.dataSource.data.length;
          this.paginator._changePageSize(this.paginator.pageSize);
        }
      });
    }
  }
}
