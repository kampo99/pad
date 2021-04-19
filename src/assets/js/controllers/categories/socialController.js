/**
 * Controller responsible for all events in view and setting data
 *
 * @author Pim Meijer
 */

class SocialController extends CategoryController {

    constructor() {
        super();
        this.loadView("views/social.html");
        this.userRepository = new UserRepository();
    }

    //Called when the login.html has been loaded.
    setup(data) {
        //Set the navigation color to the correct CSS variable.
        this.updateCurrentCategoryColor("--color-category-social");
        //Set the navigation to the correct state.
        nav.setNavigationState(navState.User)
        //Load the login-content into memory.
        this.view = $(data);

        //Empty the content-div and add the resulting view to the page.
        $(".content").empty().append(this.view);
        this.retrieveCaretakerInfo()

    }

    async retrieveCaretakerInfo() {
        try {
            const currentLoggedID = sessionManager.get("userID");
            const roomData = await this.userRepository.getCaretakerInfo(currentLoggedID);
            console.log(roomData)
            const caretakerID = roomData[0].caretaker_id;
            const fullname = roomData[0].first_name + " " + roomData[0].last_name

            document.querySelectorAll(".name_caretaker").forEach((element) => {
                element.innerText = fullname
            })
            document.querySelector(".phone_caretaker").innerText = roomData[0].phone
            document.querySelector(".email_caretaker").innerText = roomData[0].email
            document.querySelector(".experience1_caretaker").innerText = roomData[0].experience_field1
            document.querySelector(".experience2_caretaker").innerText = roomData[0].experience_field2
            document.querySelector(".experience3_caretaker").innerText = roomData[0].experience_field3
            document.querySelector(".description_caretaker").innerText = roomData[0].description
            //profile pic
            document.querySelector(".profile_pic_caretaker").src = `assets/img/caretaker/${caretakerID}_profile_pic.png`;

        } catch (e) {
            console.log("error while fetching rooms", e);
        }

    }
}