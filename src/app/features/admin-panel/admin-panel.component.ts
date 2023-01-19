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
import {catchError, debounceTime, of, tap} from "rxjs";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatDrawer} from "@angular/material/sidenav";
import {MatSort} from "@angular/material/sort";
import {MatSnackBar} from "@angular/material/snack-bar";




@Component(
  {
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MatSnackBar]
})
export class AdminPanelComponent implements OnInit {

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

  constructor(private _adminService: AdminService,
              private _change: ChangeDetectorRef,
              private _snackBar: MatSnackBar) {
    // When using the search field, a request is generated every half second
    // and a list of users matching its value is searched.
    // If the search field is empty, all user data will be loaded
    this.searchField.valueChanges.pipe(debounceTime(500)).subscribe((text: string) => {
      this._adminService.findUser({search: text}).pipe(
        tap((value) => {
          this.dataSource = new MatTableDataSource<UserDataInt>(value.data.entities);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this._change.detectChanges();
        }),
        catchError(err =>{
          this.openSnackBar("Could not load user data !", "Okey");
          return of ([]);
        })
      ).subscribe()
    })
  }

  ngOnInit(): void {
    // when component is loaded, it's automatically update user roles
    this._adminService.getRoles().pipe(
      tap((value) => {
        this.UserRoles = value
        this._change.detectChanges();
      }),
      catchError(err => {
        this.openSnackBar("Unfortunately, the user roles could not be loaded", "Okey");
        return of ([]);
      })
    ).subscribe();

    // when component loads, it's automatically load every user data in table
    this._adminService.findUser({search: ""}).pipe(
      tap((value) => {
        this.dataSource = new MatTableDataSource<UserDataInt>(value.data.entities);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this._change.detectChanges();
      }),
      catchError(err =>{
        this.openSnackBar("Could not load user data !", "Okey");
          return of ([]);
      })
    ).subscribe();
  }

  // For pop up alerts
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
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

    this._adminService.saveUser(userData).pipe(
      tap((value) => {
        this.dataSource.data.push(value.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this._change.detectChanges();
      }),
      catchError(err => {
        this.openSnackBar("Unfortunately, a new user could not be added", "Okey");
        return of ([]);
      })
    ).subscribe();
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

  // Enters user data into the form, which allows for changes to be made.
  setUpdatedata(data: UserDataInt){
    this.openCloseDrawer(true);
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

  // It will update the user data in the database as well as in the table
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

    this._adminService.saveUser(userData).pipe(
      tap((value) => {
        const userToUpdate = this.dataSource.data.find(user => user.id === userData.id);
        if(userToUpdate){
          userToUpdate.firstName = userData.firstName;
          userToUpdate.lastName = userData.lastName;
          userToUpdate.email = userData.email;
          userToUpdate.locked = userData.locked;
          userToUpdate.roles = userData.roles;

          // after update user, it's clears form and close sidebar
          this.openCloseDrawer(false);

          this.userForm.reset();
          this._change.detectChanges();
        }
      }),
      catchError(err => {

        this.openSnackBar("Unfortunately, the user data could not be updated", "Okey");
        return of ([]);
      })
    ).subscribe();
  }

  // deletes user data from DB as well as the table
  deleteUser(data: UserDataInt){
    if (confirm(`Are you sure to delete ${data.firstName} ${data.lastName}`)){
      this._adminService.deleteUser(data.id!).pipe(
        tap((value) => {
          if (value.success){
            // Delete the user from the data source
            this.dataSource.data = this.dataSource.data.filter(user => user.id !== data.id);
            // Update the paginator's length and page properties
            this.paginator.length = this.dataSource.data.length;
            this.paginator._changePageSize(this.paginator.pageSize);
          }else{
            this.openSnackBar("User data could not be deleted!", "Okey");
          }
        }),
        catchError(err => {
          this.openSnackBar("User data could not be deleted!", "Okey");
          return of ([]);
        })
      ).subscribe();
    }
  }
}
