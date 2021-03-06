import {Component} from '@angular/core';
import {IonicPage, LoadingController, ModalController, NavController, NavParams} from 'ionic-angular';
import {BuildingContactRepositoryProvider} from '../../providers/repositories/building-contact-repository';
import {InspectionBuildingContactForList} from '../../models/inspection-building-contact-for-list';

@IonicPage()
@Component({
    selector: 'page-building-contacts',
    templateUrl: 'building-contacts.html',
})
export class BuildingContactsPage {

    private readonly idBuilding: string;
    private readonly name: string;
    public contacts: InspectionBuildingContactForList[] = [];

    constructor(
        private load: LoadingController,
        private contactRepo: BuildingContactRepositoryProvider,
        private modalCtrl: ModalController,
        public navCtrl: NavController,
        public navParams: NavParams) {

        this.idBuilding = navParams.get('idBuilding');
        this.name = navParams.get('name');
    }

    public async ionViewDidEnter() {
        await this.loadContactList();
    }

    private async loadContactList() {
        let loader = this.load.create({content: 'Patientez...'});
        try {
          const result = await this.contactRepo.getList(this.idBuilding);
          this.contacts = result;
        } finally {
          await loader.dismiss();
        }
    }

    public onItemClick(idBuildingContact: string): void {
        let modal = this.modalCtrl.create('BuildingContactDetailPage', {
            idBuildingContact: idBuildingContact,
            idBuilding: this.idBuilding
        });
        modal.onDidDismiss(() => this.loadContactList());
        modal.present();
    }
}
