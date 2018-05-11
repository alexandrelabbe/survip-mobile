import { Component } from '@angular/core';
import {IonicPage, LoadingController, ModalController, NavController, NavParams} from 'ionic-angular';
import {InspectionBuildingFireProtectionForList} from '../../models/inspection-building-fire-protection-for-list';
import {AuthenticationService} from '../../providers/Base/authentification.service';
import {InspectionBuildingSprinklerRepositoryProvider} from '../../providers/repositories/inspection-building-sprinkler-repository-provider.service';
import {InspectionBuildingAlarmPanelRepositoryProvider} from '../../providers/repositories/inspection-building-alarm-panel-repository-provider.service';


@IonicPage()
@Component({
  selector: 'page-building-fire-protection',
  templateUrl: 'building-fire-protection.html',
})
export class BuildingFireProtectionPage {

  private readonly idBuilding: string;
  private readonly name: string;

  public sprinklers: InspectionBuildingFireProtectionForList[] = [];
  public panels: InspectionBuildingFireProtectionForList[] = [];
  public currentSegment: string = "panel";

  constructor(
    private sprinklerRepo: InspectionBuildingSprinklerRepositoryProvider,
    private panelRepo: InspectionBuildingAlarmPanelRepositoryProvider,
    private load: LoadingController,
    private authService: AuthenticationService,
    private modalCtrl: ModalController,
    public navCtrl: NavController,
    public navParams: NavParams) {

    this.idBuilding = navParams.get('idBuilding');
    this.name = navParams.get('name');
  }

  ionViewDidLoad() {
  }

  get entityName(): string{
    return this.currentSegment == 'panel' ? "panneau d'alarme" : "gicleur";
  }

  async ionViewDidEnter() {
    await this.loadPanels();
    await this.loadSprinklers();
  }

  async ionViewCanEnter() {
    let isLoggedIn = await this.authService.isStillLoggedIn();
    if (!isLoggedIn)
      this.redirectToLoginPage();
  }

  private redirectToLoginPage(): void{
    this.navCtrl.setRoot('LoginPage');
  }

  private async loadSprinklers() {
    let loader = this.load.create({content: 'Patientez...'});
    const result = await this.sprinklerRepo.getList(this.idBuilding);
    this.sprinklers = result;
    await loader.dismiss();
  }

  private async loadPanels() {
    let loader = this.load.create({content: 'Patientez...'});
    const result = await this.panelRepo.getList(this.idBuilding);
    this.panels = result;
    await loader.dismiss();
  }

  public onPanelClick(idPanel: string): void {
    let modal = this.modalCtrl.create('BuildingAlarmPanelsPage', { idBuildingAlarmPanel: idPanel, idBuilding: this.idBuilding });
    modal.onDidDismiss(() => this.loadPanels());
    modal.present();
  }

  public onSprinklerClick(idSprinkler: string): void {
    let modal = this.modalCtrl.create('BuildingWaterSprinklersPage', { idBuildingSprinkler: idSprinkler, idBuilding: this.idBuilding });
    modal.onDidDismiss(() => this.loadSprinklers());
    modal.present();
  }

  onCreateNewRecord() {
    if (this.currentSegment == 'panel')
      this.onPanelClick(null);
    else
      this.onSprinklerClick(null);
  }
}
