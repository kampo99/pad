/**
 * Controller responsible for all events in view and setting data
 *
 * @author Pim Meijer
 */
class PatientsController extends CategoryController {

    constructor() {
        super();
        this.loadView("views/caretaker/patients.html");
        this.caretakerRepository = new CaretakerRepository();
    }

    //Called when the login.html has been loaded.
    setup(data) {
        //Set the navigation color to the correct CSS variable.
        this.updateCurrentCategoryColor("--color-category-default");
        //Set the navigation to the correct state.
        nav.setNavigationState(navState.Caretaker)
        //Load the login-content into memory.
        this.view = $(data);
        this.caretakerRepository.getAllRehab(sessionManager.get("userID")).then(data => {
            this.createPatients(data)
        });
        //Empty the content-div and add the resulting view to the page.
        $(".content").empty().append(this.view);
        $(".block-primary").hide();
    }

    /**
     * here you set all data from the database in html
     * @param patients
     */
    async createPatients(patients) {
        let blocky = $(".block-primary");
        for (let i = 0; i < patients.length; i++) {
            const clonedElement = blocky.clone();
            clonedElement.attr('class', 'block-' + i + ' row justify-content-md-center mt-5');

            //set the data in html
            $(".ct-name", clonedElement).text(`${patients[i]['first_name']} ${patients[i]['last_name']}`);
            $(".ct-year", clonedElement).text("Leeftijd: " + this.getAge(patients[i].birthdate));
            $(".ct-gender", clonedElement).text("Geslacht: " + patients[i].gender);
            $(".ct-bloodtype", clonedElement).text("Bloed type: " + patients[i].bloodtype);
            $(".ct-status", clonedElement).text("Status: " + patients[i].status);
            $(".ct-phonenumber", clonedElement).text("Mobiel: " + patients[i].phonenumber);
            $(".ct-mail", clonedElement).text("Email: " + patients[i].email);
            $(".ct-description", clonedElement).text(patients[i].description);

            //TODO: Get correct image of patient.
            if (patients[i].gender === "Vrouw"){
                clonedElement.find(".imgpatient").attr('src','assets/img/patient2.png');
            } else {
                clonedElement.find(".imgpatient").attr('src','assets/img/patient1.png');
            }

            //Load progress bar.
            const progressBar = await new ProgressComponent(clonedElement.find(".progress-anchor"));
            const pamdata = await progressBar.retrieveProgressData(patients[i]['user_id']);
            progressBar.setProgressBarData(pamdata['total'], pamdata['current'], pamdata['daily']);
            progressBar.setAppointmentText(pamdata['date']);

            clonedElement.insertAfter(blocky);
            clonedElement.show()
        }
        $(".block-primary").remove();
    }

    /**
     * here you calculate the age of the patient
     * @param dateString
     * @returns {number}
     */
    getAge(dateString) {
        let today = new Date();
        let birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        let m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
}