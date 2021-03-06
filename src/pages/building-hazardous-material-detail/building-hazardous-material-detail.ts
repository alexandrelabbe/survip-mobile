import {Component} from '@angular/core';
import {IonicPage, LoadingController, ModalController, NavController, NavParams, ViewController} from 'ionic-angular';
import {ISubscription} from 'rxjs/Subscription';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {InspectionBuildingHazardousMaterial} from '../../models/inspection-building-hazardous-material';
import {MessageToolsProvider} from '../../providers/message-tools/message-tools';
import {InspectionBuildingHazardousMaterialRepositoryProvider} from '../../providers/repositories/inspection-building-hazardous-material-repository';
import {UUID} from 'angular2-uuid';
import {HazardousMaterialRepositoryProvider} from '../../providers/repositories/hazardous-material-repository';
import {UnitOfMeasure} from '../../models/all-construction-types';
import {UnitOfMeasureRepositoryProvider} from '../../providers/repositories/unit-of-measure-repository';
import {StaticListRepositoryProvider} from '../../providers/static-list-repository/static-list-repository';
import {HazardousMaterialForList} from '../../models/hazardous-material-for-list';
import {TranslateService} from "@ngx-translate/core";


@IonicPage()
@Component({
    selector: 'page-building-hazardous-material-detail',
    templateUrl: 'building-hazardous-material-detail.html',
})
export class BuildingHazardousMaterialDetailPage {

    private idBuildingHazardousMaterial: string;
    private readonly idBuilding: string;
    private subscription: ISubscription;
    private readonly integerPattern: string = "^(0|([1-9]([0-9]*)))$";
    private readonly decimalPattern: string = "^[0-9]+(.[0-9]{1,2})?$";

    public isNew: boolean = false;
    public selectedMaterial: HazardousMaterialForList;
    public material: InspectionBuildingHazardousMaterial;
    public form: FormGroup;
    public unitOfMeasures: UnitOfMeasure[] = [];
    public walls: string[] = [];
    public sectors: string[] = [];
    public labels = {};

    constructor(
        private fb: FormBuilder,
        private loadCtrl: LoadingController,
        private staticRepo: StaticListRepositoryProvider,
        private repo: InspectionBuildingHazardousMaterialRepositoryProvider,
        private matRepo: HazardousMaterialRepositoryProvider,
        private unitRepo: UnitOfMeasureRepositoryProvider,
        private msg: MessageToolsProvider,
        private viewCtrl: ViewController,
        private modalCtrl: ModalController,
        public navCtrl: NavController,
        public navParams: NavParams,
        private translateService: TranslateService) {

        this.idBuilding = navParams.get("idBuilding");
        this.idBuildingHazardousMaterial = navParams.get('idBuildingHazardousMaterial');
        this.isNew = this.idBuildingHazardousMaterial == null;
        this.walls = this.staticRepo.getWallList();
        this.sectors = this.staticRepo.getSectorList();
        this.unitRepo.getAllForCapacity()
            .subscribe(data => this.unitOfMeasures = data);
        this.createForm();
    }

    public ngOnInit() {
        this.translateService.get([
            'confirmation', 'waitFormMessage', 'hazardousMaterialDeleteQuestion', 'hazardousMaterialLeaveMessage'
        ]).subscribe(labels => {
                this.labels = labels;
            },
            error => {
                console.log(error)
            });
    }

    public async ionViewDidLoad() {
        let load = this.loadCtrl.create({'content': this.labels['waitFormMessage']});
        await load.present();
        try {
          if (this.idBuildingHazardousMaterial == null)
            this.createBuildingHazardousMaterial();
          else
            this.material = await this.repo.get(this.idBuildingHazardousMaterial);

          await this.loadHazardousMaterialName();
          this.setValuesAndStartListening();
        } finally {
          await load.dismiss();
        }
    }

    private createForm() {
        let unitOfMeasureValidator = (control: FormControl) => {
            if (this.material != null && this.form.value['capacityContainerMasked'] > 0 && (control.value == null || control.value == ""))
                return {'missingUnitOfMeasure': true};
            return null;
        };

        let regexChecker = (mask: string) => {
            return (control: FormControl) => {
                var value = control.value + "";
                const reg = new RegExp(mask);
                if (reg.test(value))
                    return null;
                else
                    return {'incorrectValue': true};
            };
        };

        this.form = this.fb.group({
            idHazardousMaterial: ['', [Validators.required]],
            quantityMasked: [0, [Validators.required, Validators.min(0), Validators.max(999999), regexChecker(this.integerPattern)]],
            idUnitOfMeasure: ['', [unitOfMeasureValidator]],
            container: ['', Validators.maxLength(100)],
            capacityContainerMasked: [0, [Validators.min(0), Validators.required, Validators.max(99999), regexChecker(this.decimalPattern)]],
            tankTypeMasked: [0, Validators.required],
            supplyLine: ['', [Validators.maxLength(50)]],
            place: ['', [Validators.maxLength(200)]],
            wall: ['', Validators.maxLength(15)],
            sector: ['', Validators.maxLength(15)],
            floor: ['', Validators.maxLength(4)],
            gasInlet: ['', Validators.maxLength(100)],
            securityPerimeter: ['', Validators.maxLength(500)],
            otherInformation: ['', Validators.maxLength(500)]
        });
    }

    private setValuesAndStartListening(): void {
        this.setValues();
        this.startWatchingForm();
    }

    private setValues() {
        if (this.material != null) {
            this.form.patchValue(this.material);
            this.form.controls['quantityMasked'].patchValue(this.material.quantity, {emitEvent: false});
            this.form.controls['capacityContainerMasked'].patchValue(this.material.capacityContainer, {emitEvent: false});
            this.form.controls['tankTypeMasked'].patchValue(this.material.tankType, {emitEvent: false});
        }
    }

    private startWatchingForm() {
        this.subscription = this.form.valueChanges
            .debounceTime(500)
            .subscribe(() => this.saveIfValid());
    }

    private saveIfValid() {
        if (this.form.valid && this.form.dirty)
            this.saveForm();
    }

    public getAllErrors(form: FormGroup): { [key: string]: any; } | null {
        let hasError = false;
        const result = Object.keys(form.controls).reduce((acc, key) => {
            const control = form.get(key);
            const errors = (control instanceof FormGroup)
                ? this.getAllErrors(control)
                : control.errors;
            if (errors) {
                acc[key] = errors;
                hasError = true;
            }
            return acc;
        }, {} as { [key: string]: any; });
        return hasError ? result : null;
    }

    private async saveForm() {
        Object.assign(this.material, this.form.value);
        this.material.quantity = parseInt(this.form.value.quantityMasked);
        this.material.capacityContainer = parseFloat(this.form.value.capacityContainerMasked);
        this.material.tankType = parseInt(this.form.value.tankTypeMasked);
        await this.repo.save(this.material);
        this.form.markAsPristine();
        this.isNew = false;
    }

    private createBuildingHazardousMaterial() {
        let data = new InspectionBuildingHazardousMaterial();
        data.id = UUID.UUID();
        data.tankType = 0;
        data.quantity = 0;
        data.capacityContainer = 0;
        data.idBuilding = this.idBuilding;
        this.idBuildingHazardousMaterial = data.id;
        this.material = data;
    }

    private async loadHazardousMaterialName() {
        if (this.material && this.material.idHazardousMaterial != "" && this.material.idHazardousMaterial != null) {
            let data = await this.matRepo.getSelectedMaterial(this.material.idHazardousMaterial);
            this.selectedMaterial = data;
        }
        else
            this.selectedMaterial = null;
    }

    public async onDeleteHazardousMaterial() {
        if (!this.isNew && await this.msg.ShowMessageBox(this.labels['confirmation'], this.labels['hazardousMaterialDeleteQuestion'])) {
            await this.repo.delete(this.idBuildingHazardousMaterial);
            await this.viewCtrl.dismiss();
        }
        else if (this.isNew) {
            await this.viewCtrl.dismiss();
        }
    }

    public onChangeMaterial() {
        let matModal = this.modalCtrl.create('HazardousMaterialSelectionPage');
        matModal.onDidDismiss(data => {
            if (data.hasSelected) {
                this.form.markAsDirty();
                this.form.controls['idHazardousMaterial'].setValue(data.selectedId);
                this.material.idHazardousMaterial = data.selectedId;
                this.saveIfValid();
                this.loadHazardousMaterialName();
            }
        });
        matModal.present();
    }

    public async onCancelEdition() {
        if (this.form.dirty || this.isNew) {
            if (await this.msg.ShowMessageBox(this.labels['confirmation'], this.labels['hazardousMaterialLeaveMessage']))
                await this.viewCtrl.dismiss();
        }
        else
            await this.viewCtrl.dismiss();
    }

    public getSelectedMaterialDescription() {
        if (this.selectedMaterial != null)
            return this.selectedMaterial.name + " (" + this.selectedMaterial.number + ")";
        else
            return '';
    }

    public onCapacityChanged(){
        if(!this.material.idUnitOfMeasure){
            this.form.controls['idUnitOfMeasure'].reset();
        }
    }
}
