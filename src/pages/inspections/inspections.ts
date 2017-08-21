import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import {InspectionMapPage} from '../inspection-map/inspection-map';

@Component({
  selector: 'page-inspections',
  templateUrl: 'inspections.html'
})
@IonicPage()
export class InspectionsPage {
  inspectionListRoot = 'InspectionListPage';
  inspectionMapRoot = InspectionMapPage;

  constructor(public navCtrl: NavController) {}
}
