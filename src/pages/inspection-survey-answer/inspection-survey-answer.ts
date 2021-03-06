import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {InspectionSurveyAnswer, SurveyQuestionTypeEnum} from "../../models/inspection-survey-answer";
import {InspectionSurveyAnswerRepositoryProvider} from "../../providers/repositories/inspection-survey-answer-repository-provider";
import {MessageToolsProvider} from "../../providers/message-tools/message-tools";
import {TranslateService} from "@ngx-translate/core";
import {InspectionControllerProvider} from "../../providers/inspection-controller/inspection-controller";
import {UUID} from "angular2-uuid";

@IonicPage()
@Component({
    selector: 'page-inspection-survey-answer',
    templateUrl: 'inspection-survey-answer.html',
})
export class InspectionSurveyAnswerPage {
    public inspectionQuestionAnswer: InspectionSurveyAnswer[] = [];
    public inspectionSurveyQuestion: InspectionSurveyAnswer[] = [];
    public questionTypeEnum = SurveyQuestionTypeEnum;
    public idInspection: string = '';
    public inspectionSurveyCompleted: boolean = false;
    public selectedIndex = 0;
    public currentQuestion: InspectionSurveyAnswer = new InspectionSurveyAnswer();
    public currentAnswer: InspectionSurveyAnswer = new InspectionSurveyAnswer();
    public previousQuestionAvailable = false;
    public nextQuestionDisabled = false;
    public nextButtonTitle: string = 'Suivante';
    public nextQuestionId: string = '';
    public labels = {};
    public currentQuestionAnswerList: InspectionSurveyAnswer[] = [];

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                public surveyRepo: InspectionSurveyAnswerRepositoryProvider,
                private messageTools: MessageToolsProvider,
                private translateService: TranslateService,
                private inspectionController: InspectionControllerProvider) {

        this.idInspection = this.navParams.get('idInspection');
        this.inspectionSurveyCompleted = this.navParams.get('inspectionSurveyCompleted');
        this.loadInspectionQuestion();
    }

    public ngOnInit() {
        this.translateService.get([
            'surveyCompletedMessage', 'surveyNextQuestion', 'complete', 'surveyDeleteQuestionGroup', 'confirmation'
        ]).subscribe(labels => {
                this.labels = labels;
            },
            error => {
                console.log(error)
            });
        this.nextButtonTitle = this.labels['surveyNextQuestion'];
    }

    public loadInspectionQuestion() {
        this.surveyRepo.getQuestionList(this.idInspection)
            .subscribe(result => {
                    this.inspectionSurveyQuestion = result;
                    this.loadInspectionAnswer();
                },
                error => {
                    this.messageTools.showToast('Une erreur est survenue lors du chargement du questionnaire veuillez réessayer ultérieurement.', 5);
                    this.navCtrl.pop();
                });
    }

    private loadInspectionAnswer() {
        this.surveyRepo.getAnswerList(this.idInspection)
            .subscribe(answerResult => {
                this.inspectionQuestionAnswer = answerResult;

                if (this.inspectionQuestionAnswer.length > 0) {
                    this.selectedIndex = this.findQuestion(this.initAnswerStartQuestion());
                }

                this.currentQuestion = this.inspectionSurveyQuestion[this.selectedIndex];

                this.initiateAnswers();

                this.getNextQuestionFromAnswer();

                this.manageNavigationDisplay();
            });
    }

    private findQuestion(idSurveyQuestion: string) {
        const questionCount = this.inspectionSurveyQuestion.length;
        for (let index = 0; index < questionCount; index++) {
            if (this.inspectionSurveyQuestion[index].idSurveyQuestion == idSurveyQuestion && (!this.inspectionSurveyQuestion[index].answer)) {
                return index;
            }
        }
    }

    private findAnswer(idSurveyQuestion: string) {
        const questionCount = this.inspectionQuestionAnswer.length;
        for (let index = 0; index < questionCount; index++) {
            if (this.inspectionQuestionAnswer[index].idSurveyQuestion == idSurveyQuestion) {
                return index;
            }
        }
        return this.inspectionQuestionAnswer.length;
    }

    private findLastAnswerForQuestion(idSurveyQuestion: string) {
        const questionCount = this.inspectionQuestionAnswer.length - 1;
        for (let index = questionCount; index >= 0; index--) {
            if (this.inspectionQuestionAnswer[index].idSurveyQuestion == idSurveyQuestion) {
                return index;
            }
        }
        return questionCount;
    }

    public findAnswerById(id: string): number {
        const answerCount = this.inspectionQuestionAnswer.length;
        for (let index = 0; index < answerCount; index++) {
            if (this.inspectionQuestionAnswer[index].id == id) {
                return index;
            }
        }
        return 0;
    }

    private completeInspectionQuestion() {
        this.surveyRepo.CompleteSurvey(this.idInspection)
            .subscribe(result => {
                    this.messageTools.showToast(this.labels['surveyCompletedMessage'], 3);
                    setTimeout(() => {
                        this.navCtrl.push('InspectionSurveySummaryPage', {idInspection: this.idInspection});
                    }, 3000);
                },
                error => {
                    this.messageTools.showToast('Une erreur est survenue lors de la finalisation du questionnaire, veuillez réessayer ultérieurement.', 3);
                });
    }

    public previousQuestion() {
        const lastQuestion = this.inspectionQuestionAnswer[this.findAnswer(this.currentQuestion.idSurveyQuestion) - 1].idSurveyQuestion;
        this.selectedIndex = this.findQuestion(lastQuestion);
        this.currentQuestion = this.inspectionSurveyQuestion[this.selectedIndex];
        this.initiateAnswers();
        this.getNextQuestionFromAnswer();
        this.manageNavigationDisplay();
    }

    public nextQuestion() {
        if (this.selectedIndex == (this.inspectionSurveyQuestion.length - 1)) {
            this.completeInspectionQuestion();
        } else {
            this.selectedIndex = this.findQuestion(this.nextQuestionId);
            this.currentQuestion = this.inspectionSurveyQuestion[this.selectedIndex];
            this.initiateAnswers();
            this.getNextQuestionFromAnswer();
        }
        this.manageNavigationDisplay();
    }

    public updateGroupQuestionAnswer(data) {
        this.updateAnswerResult(data);
    }

    private updateAnswerResult(answerGroup) {
        if (answerGroup) {
            const Index = this.findAnswerById(answerGroup.id);
            this.inspectionQuestionAnswer[Index] = answerGroup;
        }
    }

    private manageNavigationDisplay() {
        if (this.selectedIndex > 0) {
            this.previousQuestionAvailable = true;
        } else {
            this.previousQuestionAvailable = false;
        }

        if ((this.selectedIndex == (this.inspectionSurveyQuestion.length - 1))) {
            this.nextButtonTitle = this.labels['complete'];
        } else {
            this.nextButtonTitle = this.labels['surveyNextQuestion'];
        }
    }

    public getNextQuestionFromAnswer() {
        let answer = this.getCurrentAnswer();
        if (answer.answer) {
            if (answer.questionType == this.questionTypeEnum.choiceAnswer) {
                this.nextQuestionId = this.getChoiceNextQuestionId(answer.idSurveyQuestionChoice);
                if (!this.nextQuestionId) {
                    this.nextQuestionId = answer.idSurveyQuestionNext;
                }
            } else {
                this.nextQuestionId = answer.idSurveyQuestionNext;
            }
            if (!this.nextQuestionId) {
                this.nextQuestionId = this.getNextSequencedQuestion();
            }
            this.nextQuestionDisabled = false;
        } else {
            this.nextQuestionDisabled = true;
            this.nextQuestionId = null;
        }
    }

    private getCurrentAnswer() {
        let answer = Object.assign({}, this.currentAnswer);
        if (this.currentQuestion.questionType == SurveyQuestionTypeEnum.groupedQuestion) {
            answer = Object.assign({}, this.currentQuestionAnswerList[0]);
            if (!this.isGroupQuestionComplete()) {
                answer.answer = '';
            }
        }
        return answer;
    }

    private isGroupQuestionComplete() {
        let retValue = false;
        this.currentQuestionAnswerList.forEach(answer => {
            if(answer.childSurveyAnswerList &&
               answer.childSurveyAnswerList
                   .filter(ca => ca.idSurveyQuestionNext == '00000000-0000-0000-0000-000000000000'
                                        && ca.answer != null).length > 0) {
                retValue = true;
            }
        });
        return retValue;
    }

    private getNextSequencedQuestion() {
        let nextId = null;
        const nextSequencedQuestions = this.inspectionSurveyQuestion.filter(question => question.idParent == null && question.sequence > this.currentQuestion.sequence);
        if (nextSequencedQuestions.length > 0) {
            nextId = nextSequencedQuestions[0].idSurveyQuestion;
        }
        return nextId;
    }

    private getChoiceNextQuestionId(idChoiceSelected) {
        let idNext = '';
        const count = this.currentQuestion.choicesList.length;
        for (let index = 0; index < count; index++) {
            if (this.currentQuestion.choicesList[index].id == idChoiceSelected) {
                if (this.currentQuestion.choicesList[index].idSurveyQuestionNext) {
                    idNext = this.currentQuestion.choicesList[index].idSurveyQuestionNext;
                }
                break;
            }
        }
        return idNext;
    }

    public ionViewWillLeave() {
        if (this.navCtrl.getPrevious().name == "InterventionHomePage") {
            this.inspectionController.loadInterventionForm();
        }
    }

    private initQuestionGroupAnswers() {
        this.currentQuestionAnswerList = [];
        const answers = this.inspectionQuestionAnswer.filter(answer => answer.idSurveyQuestion == this.currentQuestion.idSurveyQuestion);
        if (answers.length > 0) {
            for (let index = 0; index < answers.length; index++) {
                this.currentQuestionAnswerList.push(this.updateChildWithAnswered(answers[index]));
            }
        } else {
            for (let index = 0; index <= this.inspectionSurveyQuestion[this.selectedIndex].minOccurrence; index++) {
                this.inspectionQuestionAnswer.push(this.createGroupAnswerParent());
            }
            this.currentQuestionAnswerList = this.inspectionQuestionAnswer.filter(answer => answer.idSurveyQuestion == this.currentQuestion.idSurveyQuestion);
        }
    }

    private updateChildWithAnswered(answeredQuestion): InspectionSurveyAnswer {

        let mergedAnswered: InspectionSurveyAnswer = new InspectionSurveyAnswer();

        mergedAnswered = JSON.parse(JSON.stringify(this.inspectionSurveyQuestion[this.selectedIndex]));

        mergedAnswered.id = answeredQuestion.id;
        mergedAnswered.answer = answeredQuestion.answer;

        if (answeredQuestion.childSurveyAnswerList) {
            answeredQuestion.childSurveyAnswerList.forEach(answer => {
                let questionToAnswer = mergedAnswered.childSurveyAnswerList.find((question) => question.idSurveyQuestion == answer.idSurveyQuestion);
                if (questionToAnswer) {
                    questionToAnswer.id = answer.id;
                    questionToAnswer.answer = answer.answer;
                    questionToAnswer.idSurveyQuestionChoice = answer.idSurveyQuestionChoice;
                }
            });
        }

        return mergedAnswered;
    }

    public initiateAnswers() {
        if (this.currentQuestion.questionType == SurveyQuestionTypeEnum.groupedQuestion) {
            this.initQuestionGroupAnswers();
        } else {
            const answers = this.inspectionQuestionAnswer.filter(answer => answer.idSurveyQuestion == this.currentQuestion.idSurveyQuestion);
            if (answers.length > 0) {
                this.currentAnswer = answers[0];
            } else {
                this.inspectionQuestionAnswer.push(JSON.parse(JSON.stringify(this.inspectionSurveyQuestion[this.selectedIndex])));
                this.currentAnswer = this.inspectionQuestionAnswer.filter(answer => answer.idSurveyQuestion == this.currentQuestion.idSurveyQuestion)[0];
            }
        }
    }

    public async addNewQuestionGroup() {
        if ((this.currentQuestionAnswerList.length < this.inspectionSurveyQuestion[this.selectedIndex].maxOccurrence) || this.inspectionSurveyQuestion[this.selectedIndex].maxOccurrence == 0) {
            let index = this.findLastAnswerForQuestion(this.currentQuestion.idSurveyQuestion);
            this.inspectionQuestionAnswer.splice(index + 1, 0, this.createGroupAnswerParent());
            this.currentQuestionAnswerList = this.inspectionQuestionAnswer.filter(answer => answer.idSurveyQuestion == this.currentQuestion.idSurveyQuestion);
        }
        this.getNextQuestionFromAnswer();
    }

    public deleteChildQuestion(answerId: string) {
        const index = this.findAnswerById(answerId);
        if (this.inspectionQuestionAnswer.filter(answer => answer.idSurveyQuestion == this.currentQuestion.idSurveyQuestion).length > 1) {
            this.inspectionQuestionAnswer.splice(index, 1);
            this.surveyRepo.deleteSurveyAnswers([answerId]).subscribe();
        } else {
            this.inspectionQuestionAnswer[index].childSurveyAnswerList = Object.assign([], this.currentQuestion.childSurveyAnswerList);
        }
        this.currentQuestionAnswerList = this.inspectionQuestionAnswer.filter(answer => answer.idSurveyQuestion == this.currentQuestion.idSurveyQuestion);
        this.getNextQuestionFromAnswer();
    }

    public deleteRemainingAnswers(answerId: string) {
        const startIndex = this.findAnswerById(answerId) + 1;
        let ids = [];
        for (let index = startIndex; index < this.inspectionQuestionAnswer.length; index++) {
            if (this.inspectionQuestionAnswer[index].id) {
                ids.push(this.inspectionQuestionAnswer[index].id);
            }
        }
        if (ids.length > 0) {
            this.surveyRepo.deleteSurveyAnswers(ids)
                .subscribe(() => {
                    this.inspectionQuestionAnswer.splice(startIndex);
                }, error => {
                    console.log("Error on delete remaining survey question", error);
                });
        }
    }

    public createGroupAnswerParent() {
        let newAnswerParent = JSON.parse(JSON.stringify(this.inspectionSurveyQuestion[this.selectedIndex]));
        newAnswerParent.id = UUID.UUID();
        newAnswerParent.answer = "Group header";
        this.surveyRepo.answerQuestion(newAnswerParent).subscribe();

        return newAnswerParent;
    }

    private initAnswerStartQuestion() {
        const answerCount = this.inspectionQuestionAnswer.length;
        for (let index = 0; index < answerCount; index++) {
            if (this.inspectionQuestionAnswer[index].questionType == SurveyQuestionTypeEnum.groupedQuestion) {
                if(this.inspectionQuestionAnswer[index].childSurveyAnswerList && this.inspectionQuestionAnswer[index].childSurveyAnswerList.length > 0) {
                    if (this.inspectionQuestionAnswer[index].childSurveyAnswerList
                        .filter(ca => ca.answer != null
                            && ca.idSurveyQuestionNext == '00000000-0000-0000-0000-000000000000').length == 0){
                        return this.inspectionQuestionAnswer[index].idSurveyQuestion;
                    }
                }else{
                    return this.inspectionQuestionAnswer[index].idSurveyQuestion;
                }
            }
        }
        return this.inspectionQuestionAnswer[this.inspectionQuestionAnswer.length - 1].idSurveyQuestion;
    }
}
