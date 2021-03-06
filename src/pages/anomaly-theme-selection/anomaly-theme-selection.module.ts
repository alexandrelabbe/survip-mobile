import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {AnomalyThemeSelectionPage} from './anomaly-theme-selection';
import {PipesModule} from '../../pipes/pipes.module';
import {TranslateModule} from "@ngx-translate/core";

@NgModule({
    declarations: [
        AnomalyThemeSelectionPage,
    ],
    imports: [
        IonicPageModule.forChild(AnomalyThemeSelectionPage),
        PipesModule,
        TranslateModule.forChild(),
    ],
})
export class AnomalyThemeSelectionPageModule {
}
