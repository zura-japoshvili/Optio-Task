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
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import {MatDrawer} from "@angular/material/sidenav";
import {MatSort, Sort} from "@angular/material/sort";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ActivatedRoute, Router} from "@angular/router";
import {FindUserInt} from "../../core/interfaces/findUserInt";


@Component(
  {
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MatSnackBar],

})
export class AdminPanelComponent implements OnInit {

  // This is for open or close to sideForm
  @ViewChild('drawer', { static: true }) drawer!: MatDrawer;


  // This data is for user list and list pagination
  public displayedColumns: string[] = ['email', 'firstName', 'lastName', 'roles', "locked", 'action'];
  public dataSource =  new MatTableDataSource<UserDataInt>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public totalCount: number = 0;
  public pageSize: number = 10;
  public pageIndex: number = 0;
  public sortBy: string = 'email';
  public sortDirection: string = 'asc';

  // for check if update form is opened or not
  public isUpdateOpen = false;


  selectedRoles: string[] = [];
  // This way, when the component is first loaded, it will have a default value for UserRoles and when
  // the data is loaded from the API, it will update with the new value.
  UserRoles: RolesInt = { data: { entities: [] }, success: false };


  public userForm = new FormGroup({
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
              private _snackBar: MatSnackBar,
              private route: ActivatedRoute,
              private router: Router) {
    // When using the search field, a request is generated every half second
    // and a list of users matching its value is searched.
    // If the search field is empty, all user data will be loaded
    this.searchField.valueChanges.pipe(debounceTime(500)).subscribe((text: string) => {
      this._adminService.findUser({search: text, sortDirection: this.sortDirection, sortBy: this.sortBy, pageSize: this.pageSize}).subscribe({
        next: ({ data }) => {
          this.dataSource.data = data.entities;
          this.totalCount = data.total
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        error: (err) => (
          this.openSnackBar("Could not load user data !", "Okey")
        )
      })
    })
  }

  ngOnInit(): void {
    // When changes are made to the form, it will automatically be saved
    // in the application URL, so that the data entered from the beginning
    // will not be lost and the user will not have to enter it again.
    this.userForm.valueChanges.subscribe(() => {
      const {firstName, lastName, email, userStatus} = this.userForm.value;
      this.router.navigate(['/admin-panel'], {
        queryParams: { firstName, lastName, email, userStatus },
        queryParamsHandling: "merge",
      });
    });
    // After the refresh, the data will be updated automatically.
    this.route.queryParamMap.subscribe(queryParamMap =>{
      if (queryParamMap.has('firstName')) {
        this.userForm.get('firstName')?.setValue(queryParamMap.get('firstName'));
      }
      if (queryParamMap.has('lastName')) {
        this.userForm.get('lastName')?.setValue(queryParamMap.get('lastName'));
      }
      if (queryParamMap.has('email')) {
        this.userForm.get('email')?.setValue(queryParamMap.get('email'));
      }
      if (queryParamMap.has('userStatus')) {
        this.userForm.get('userStatus')?.setValue(queryParamMap.get('userStatus'));
      }
    })

    // when component is loaded, it's automatically update user roles
    this._adminService.getRoles().subscribe({
       next: (value) => {
         this.UserRoles = value
       },
      error: (err) => {
        this.openSnackBar("Unfortunately, the user roles could not be loaded", "Okey");
      }
    });

    // when component loads, it's automatically load every user data in table
    this.getUser({search: '', sortBy: this.sortBy, sortDirection: this.sortDirection ,pageSize: this.pageSize, pageIndex: this.pageIndex});
  }

  public getUser(data: FindUserInt){
    this._adminService.findUser(data).subscribe(
      {
        next: ({data}) => {
          console.log(data.entities)
          this.dataSource = new MatTableDataSource<UserDataInt>(data.entities);
          this.totalCount = data.total
          this.dataSource.paginator
        },
        error: (err) => (
          this.openSnackBar(err.message, "Okey")
        )
      }
    );
  }

  // For pop up alerts
  public openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }
  // for table pagination
  public onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this._adminService.findUser({search: this.searchField.value, sortBy: this.sortBy,
      sortDirection: this.sortDirection, pageIndex: this.pageIndex, pageSize: this.pageSize})
      .subscribe((value) => {
        console.log(value.data.entities)
        this.dataSource = new MatTableDataSource<UserDataInt>(value.data.entities);
        this.totalCount = value.data.total
        this.dataSource.paginator
    })
  }

  public sortData(sort: Sort){
    this.sortBy = sort.active
    this.sortDirection = sort.direction;
    this.getUser({search: this.searchField.value, sortBy: this.sortBy, sortDirection: this.sortDirection ,pageSize: this.pageSize, pageIndex: this.pageIndex});
  }

  // save new userdata in db
  public saveUser() {
    const lockedStatus = this.userForm.value!.userStatus! === 'active';
    let userData = {
      firstName: this.userForm.value!.firstName!,
      lastName: this.userForm.value!.lastName!,
      email: this.userForm.value!.email!,
      locked: lockedStatus,
      roles: this.selectedRoles
    }

    this._adminService.saveUser(userData).subscribe({
      next: (value) => {
        // When the user data is stored in the database, the data in the URL will be deleted.
        // and also reset form value
        this.userForm.reset();
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          queryParamsHandling: "merge",
        });
        // after creating a new user in DB, we will request new data
        this.getUser({search: this.searchField.value, sortBy: this.sortBy, sortDirection: this.sortDirection ,pageSize: this.pageSize, pageIndex: this.pageIndex});
      },
      error: (err) =>{
        this.openSnackBar("Unfortunately, a new user could not be added", "Okey");
      }
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

    this._adminService.saveUser(userData).subscribe({
      next: (value) =>{
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
      },
      error: (err) => {
        this.openSnackBar("Unfortunately, the user data could not be updated", "Okey");
      }
    });
  }

  // deletes user data from DB as well as the table
  deleteUser(data: UserDataInt){
    if (confirm(`Are you sure to delete ${data.firstName} ${data.lastName}`)){
      this._adminService.deleteUser(data.id!).subscribe({
        next: (value) => {
          if (value.success){
            // Delete the user from the data source
            this.dataSource.data = this.dataSource.data.filter(user => user.id !== data.id);
            // Update the paginator's length and page properties
            this.paginator.length = this.dataSource.data.length;
            this.paginator._changePageSize(this.paginator.pageSize);
          }else{
            this.openSnackBar("User data could not be deleted!", "Okey");
          }
        },
        error: (err) => {
          this.openSnackBar("User data could not be deleted!", "Okey");
        }
      });
    }
  }
}
