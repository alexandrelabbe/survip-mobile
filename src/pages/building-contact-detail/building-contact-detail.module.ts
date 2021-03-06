import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {BuildingContactDetailPage} from './building-contact-detail';
import {DirectivesModule} from '../../directives/directives.module';
import {BrMaskerModule} from 'brmasker-ionic-3';
import {TranslateModule} from "@ngx-translate/core";

@NgModule({
    declarations: [
        BuildingContactDetailPage,
    ],
    imports: [
        IonicPageModule.forChild(BuildingContactDetailPage),
        DirectivesModule,
        BrMaskerModule,
        TranslateModule.forChild(),
    ],
})
export class BuildingContactDetailPageModule {
}
