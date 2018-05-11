import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BuildingAlarmPanelsPage } from './building-alarm-panels';
import {PipesModule} from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    BuildingAlarmPanelsPage,
  ],
  imports: [
    IonicPageModule.forChild(BuildingAlarmPanelsPage),
    PipesModule
  ],
})
export class BuildingAlarmPanelsPageModule {}
