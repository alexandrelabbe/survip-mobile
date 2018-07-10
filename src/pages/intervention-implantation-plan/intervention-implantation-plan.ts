import {Component, OnDestroy} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {FormBuilder, FormGroup} from '@angular/forms';
import {PictureData} from '../../models/picture-data';
import {AuthenticationService} from '../../providers/Base/authentification.service';
import {InterventionForm} from '../../models/intervention-form';
import {InspectionControllerProvider} from '../../providers/inspection-controller/inspection-controller';
import {InspectionDetail} from '../../models/inspection-detail';
import {ISubscription} from 'rxjs/Subscription';

@IonicPage()
@Component({
    selector: 'page-intervention-implantation-plan',
    templateUrl: 'intervention-implantation-plan.html',
})
export class InterventionImplantationPlanPage implements OnDestroy {
  public form: FormGroup;
  public json: string;

  private planSubscription : ISubscription;

    get picture(): PictureData {
        return this.controller.picture;
    }

    get plan(): InspectionDetail {
        return this.controller.inspectionDetail;
    }

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private authService: AuthenticationService,
        private fb: FormBuilder,
        private controller: InspectionControllerProvider,) {
        this.createForm();
        this.planSubscription = this.controller.pictureLoaded.subscribe(() => this.setValuesAndStartListening());
    }

    public ngOnDestroy(): void {
        if (this.planSubscription)
            this.planSubscription.unsubscribe();
    }

    public ionViewDidLoad() {
        this.controller.loadInterventionFormPicture();
    }

    public async ionViewCanEnter() {
        let isLoggedIn = await this.authService.isStillLoggedIn();
        if (!isLoggedIn)
            await this.redirectToLoginPage();
    }

    private async redirectToLoginPage() {
        await this.navCtrl.setRoot('LoginPage');
    }

    private createForm() {
        this.form = this.fb.group({picture: ['']});
    }

    public setValuesAndStartListening() {
        this.setValues();
        this.startWatchingForm();
    }

    private startWatchingForm() {
        this.form.valueChanges
            .debounceTime(500)
            .subscribe(() => this.saveIfValid());
    }

  private setValues() {
    if (this.picture != null) {
      this.form.patchValue(this.picture);
      if (!this.json) {
        this.json = this.picture.json;
      }
    }

    private async saveIfValid() {
        if (this.form.valid && this.form.dirty) {
            await this.saveForm();
        }
    }

  private async saveForm() {
    const formModel  = this.form.value;
    Object.assign(this.controller.picture, formModel);
    await this.controller.savePicture();
  }

  public async onJsonChanged(json: JSON) {
    this.controller.picture.json = JSON.stringify(json);
    // this.saveForm();
  }

  public onModelChange($event) {
    console.log('test');
    console.log(event);
    this.saveForm();
  }
}
