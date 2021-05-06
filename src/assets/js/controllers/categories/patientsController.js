/**
 * Controller responsible for all events in view and setting data
 *
 * @author Pim Meijer
 */

let birthdates = [];
let editValues = [];
let userValues = [];
let userEditValues = [];
let userIndexValue;
let userId;
let dataId;
class PatientsController extends CategoryController {

    constructor() {
        super();
        this.loadView("views/caretaker/patients.html");
        this.caretakerRepository = new CaretakerRepository();
        this.userRepository = new UserRepository();
    }

    //Called when the login.html has been loaded.
    setup(data) {
        //Set the navigation color to the correct CSS variable.
        this.updateCurrentCategoryColor("--color-category-default");
        //Set the navigation to the correct state.
        nav.setNavigationState(navState.Caretaker)
        //Load the login-content into memory.
        this.patientsView = $(data);

        //Empty the content-div and add the resulting view to the page.
        $(".content").empty().append(this.patientsView);

        this.caretakerRepository.getAllRehab(sessionManager.get("userID")).then(data => {
            this.createPatients(data)
        });

        // Open the profile editor
        $(document).on("click", ".btn-edit--profile", (e) => {
            dataId = e.target.attributes["data-id"].nodeValue
            this.openProfileEditor(dataId)
        });

        //Open the delete
        $(document).on("click", ".btn-delete--confirm", (e) => {
            dataId = e.target.attributes["data-id"].nodeValue
        });

        // Confirm the delete
        $(document).on("click", ".btn-delete--confirm", (e) => {
            this.deletePatient(dataId);
        })

        // When you want to open the profile editor
        $(document).on("click", ".btn-add--profile", (e) => {
            this.openAddFields();
        })

        //
        $(document).on("click", ".add-btn--submit", (e) => {
            this.addPatient();
        })


        // When the form gets sent
        this.patientsView.find(".edit-form").on("submit", (e) => this.editPatient(e, dataId));
    }

    /**
     * here you set all data from the database in html
     * @param patients
     */
    createPatients(patients) {
        console.log(patients);
        let blocky = $(".block-primary");
        for (let i = 0; i < patients.length; i++) {
            try {
                // console.log(patients[i].user_id)
                this.caretakerRepository.getUserInfo(patients[i].user_id).then(data => {
                    userValues.push({"username": data[0].username, "password": data[0].password, "id": data[0].id});
                });
            } catch (e) {
                console.log("yikers");
            }
            let clone = blocky.clone().insertAfter(blocky);
            clone.attr('class', 'block-' + patients[i].id + ' row justify-content-md-center mt-5')
            //set the data in html
            $(".ct-name", clone).text(`${patients[i]['first_name']}`);
            $(".ct-lastname", clone).text(`${patients[i]['last_name']}`);
            $(".ct-year", clone).text("Leeftijd: " + this.getAge(patients[i].birthdate));
            // Set the birthdate in the birthdate array
            birthdates.push({id: patients[i].id, birthdate: patients[i].birthdate})

            $(".ct-gender", clone).text("Geslacht: " + patients[i].gender);
            $(".ct-bloodtype", clone).text("Bloedtype: " + patients[i].bloodtype);
            $(".ct-status", clone).text("Status: " + patients[i].status);
            $(".ct-phonenumber", clone).text("Mobiel: " + patients[i].phonenumber);
            $(".ct-mail", clone).text("Email: " + patients[i].email);
            $(".ct-description", clone).text(patients[i].description);
            $(".btn-edit--profile", clone).attr("data-id", patients[i].id);
            $(".btn-delete--confirm", clone).attr("data-id", patients[i].id);
            //img changing to men
            if (patients[i].gender === "Vrouw"){
                clone.find(".imgpatient").attr('src','assets/img/patient2.png')
            } else {
                clone.find(".imgpatient").attr('src','assets/img/patient1.png')
            }
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

    /**
     * This function sets the modal with info from the profile it opened.
     * @param id
     */
    openProfileEditor(id) {
        // Give the submit button the right class
        if ($(".add-btn--submit")[0]) {
            console.log("yeet");
            $(".add-btn--submit").addClass("edit-btn--submit").removeClass("add-btn--submit");
        }
        // Put the right user values there
        userValues.forEach((user, index) => {
            // console.log(user.id, id);
            if (user.id === parseInt(id)) {
                console.log(user.username);
                $("#userNameAdd").val(user.username);
                $("#passwordAdd").val(user.password);
                userId = user.id;
                userIndexValue = index;
            }
        })
        // $("#userNameAdd").val()
        // Clear the array with edit values
        $("#firstNameEdit").val($(".block-" + id + " .ct-name")[0].innerHTML);
        $(".modal-title").text("Bewerk " + $(".block-" + id + " .ct-name")[0].innerHTML);
        $("#lastNameEdit").val($(".block-" + id + " .ct-lastname")[0].innerHTML);

        let momentBirthday;
        // Get the birthdate from the object, and
        birthdates.forEach((b) => {
            if (b.id === parseInt(id)) {
                momentBirthday = b.birthdate.split("T")[0];
                momentBirthday = new moment(momentBirthday);
            }
        })
        $("#birthdateEdit").val(momentBirthday.format('YYYY-MM-DD'));

        // Set radio button for gender
        let editGender = $(".block-" + id + " .ct-gender")[0].innerHTML;
        editGender = editGender.substr(editGender.indexOf(" ") + 1);

        switch (editGender) {
            case "Man":
                $("#genderManEdit").prop("checked", true);
                break;
            case "Vrouw":
                $("#genderWomanEdit").prop("checked", true);
                break;
            default:
                $("#genderNoneEdit").prop("checked", true);
                break;
        }

        let blood = $(".block-" + id + " .ct-bloodtype")[0].innerHTML;
        blood = blood.substr(blood.indexOf(" ") + 1);
        $("#bloodEdit").val(blood);

        let editStatus = $(".block-" + id + " .ct-status")[0].innerHTML;
        editStatus = editStatus.substr(editStatus.indexOf(" ") + 1);
        $("#statusEdit").val(editStatus);

        let editPhone = $(".block-" + id + " .ct-phonenumber")[0].innerHTML;
        editPhone = editPhone.substr(editPhone.indexOf(" ") + 1);
        $("#phoneEdit").val(editPhone);

        let editEmail = $(".block-" + id + " .ct-mail")[0].innerHTML;
        editEmail = editEmail.substr(editEmail.indexOf(" ") + 1);
        $("#emailEdit").val(editEmail)

        $("#descriptionEdit").val($(".block-" + id + " .ct-description")[0].innerHTML);
    }

    /**
     * Edit patient function
     * @param e, the event
     * @param id, id of the patient
     * @returns {Promise<boolean>}
     */
    async editPatient(e, id) {
        // Prevent form from sending
        e.preventDefault();

        //Remove alert
        $(".edit-succes").remove();

        // Set the lets
        let username = $("#userNameAdd");
        let password = $("#passwordAdd")
        let firstname = $("#firstNameEdit");
        let lastname = $("#lastNameEdit")
        let birthdate = $("#birthdateEdit")
        let gender = $('input[name=genderRadio]:checked', '.edit-form');
        let bloodtype = $("#bloodEdit");
        let status = $("#statusEdit");
        let phone = $("#phoneEdit")
        let email = $("#emailEdit")
        let description = $("#descriptionEdit")

        // Set editvalues;
        editValues = [];
        editValues.push(firstname.val())
        editValues.push(lastname.val())
        editValues.push(birthdate.val());
        editValues.push(gender.val());
        editValues.push(bloodtype.val());
        editValues.push(status.val());
        editValues.push(phone.val());
        editValues.push(email.val());
        editValues.push(description.val());

        // Set user edit values
        userEditValues = [];
        userEditValues.push(username.val())
        userEditValues.push(password.val())
        userEditValues.push(userId);

        if (this.validateForm(firstname.val(), lastname.val(), birthdate.val(), bloodtype.val(), status.val(), phone.val(), email.val())) {
            return false;
        }

        // Once you have the values, set them.
        try {
            let edited = await this.userRepository.update(id, editValues, userEditValues);
            $(".edit-form").prepend("<div class=\"alert alert-success edit-succes mb-2\" role=\"alert\">\n" +
                ""+ edited.values[0].firstname + " is bewerkt!\n" +
                "</div>")
            $("html, .modal").animate({ scrollTop: 0 }, "slow");

            // Set the values In the person self
            $(".ct-name").text(edited.values[0].firstname)
            $(".ct-lastname").text(edited.values[0].lastname)
            $(".ct-year").text("Leeftijd: " + this.getAge(edited.values[0].birthdate));
            $(".ct-gender").text("Geslacht: " + edited.values[0].gender);
            $(".ct-bloodtype").text("Bloedtype: " + edited.values[0].bloodtype)
            $(".ct-status").text("Status: " + edited.values[0].status)
            $(".ct-phonenumber").text("Mobiel: " + edited.values[0].phone)
            $(".ct-mail").text("Email: " + edited.values[0].email)
            $(".ct-description").text(edited.values[0].description)

            // Set the right user values in the array
            userValues[userIndexValue].username = userEditValues[0];
            userValues[userIndexValue].password = userEditValues[1];
        } catch (e) {

        }
    }

    /**
     * Delete a patient
     * @param id
     * @returns {Promise<void>}
     */
    async deletePatient(id) {
        try {
            await this.userRepository.delete(id);
            $(".block-" + id).remove();
        } catch (e) {

        }
    }

    /**
     * Checks for most values in the form if they're validated, otherwise return an error
     * @param firstname
     * @param lastname
     * @param birthdate
     * @param bloodtype
     * @param status
     * @param phone
     * @param email
     * @param username
     * @param password
     * @returns {boolean}
     */
    validateForm(firstname, lastname, birthdate, bloodtype, status, phone, email, username, password) {
        let errorcount = 0;

        // Check if firstname is empty
        if (firstname === "") {
            errorcount++;
            $("#firstnameError").text("Voornaam kan niet leeg zijn!");
        }

        if (lastname === "") {
            errorcount++;
            $("#lastnameError").text("Achternaam kan niet leeg zijn!");
        }

        if (birthdate === "") {
            errorcount++;
            $("#birthdateError").text("Geboortedatum kan niet leeg zijn!")
        } else if (!moment(birthdate).isValid()) {
            errorcount++;
            $("#birthdateError").text("Datum is niet goed ingevuld!");
        }

        if (bloodtype === "") {
            errorcount++;
            $("#bloodtypeError").text("Bloedtype is leeg, als je het bloedtype niet weet schrijf dan onbekend")
        }

        if (status === "") {
            errorcount++;
            $("#statusError").text("Status kan niet leeg zijn!")
        }

        if (phone === "") {
            errorcount++;
            $("#phoneError").text("Mobiel kan niet leeg zijn!");
        } else if (!/^\d+$/.test(phone)) {
            errorcount++;
            $("#phoneError").text("Mobiel moet alleen nummers zijn!");
        }

        if (email === "") {
            errorcount++;
            $("#emailError").text("Email kan niet leeg zijn!");
        }

        if (username === "") {
            errorcount++;
            $("#usernameError").text("Username mag niet leeg zijn!");
        }

        if (password === "") {
            errorcount++;
            $("#passwordError").text("Wachtwoord kan niet leeg zijn!");
        }

        if (errorcount > 0) {
            return true;
        } else {
            $("#firstnameError").text("");
            $("#lastnameError").text("");
            $("#birthdateError").text("")
            $("#bloodtypeError").text("")
            $("#statusError").text("")
            $("#phoneError").text("");
            $("#emailError").text("");
            $("#usernameError").text("");
            $("#passwordError").text("");
        }
    }

    openAddFields() {
        $("#firstNameEdit").val("");
        $("#lastNameEdit").val("");
        $("#birthdateEdit").val("");
        $('input[name=genderRadio]:checked', '.edit-form').attr("checked", false);
        $("#bloodEdit").val("");
        $("#statusEdit").val("");
        $("#phoneEdit").val("");
        $("#emailEdit").val("");
        $("#descriptionEdit").val("");

        // Username values
        $("#userNameAdd").val("");
        $("#passwordAdd").val("");

        // Add the class to the button so that it knows we want to add
        if ($(".edit-btn--submit")[0]) {
            $(".edit-btn--submit").addClass("add-btn--submit").removeClass("edit-btn--submit");
        }
    }

    async addPatient() {
        console.log("je had gewoon een tweede modal kunnen maken XD!")
    }

}
