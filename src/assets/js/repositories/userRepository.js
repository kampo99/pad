/**
 * Repository responsible for all user data from server - CRUD
 * Make sure all functions are using the async keyword when interacting with network!
 *
 * @author Pim Meijer
 */
class UserRepository {

    constructor() {
        this.route = "/user"
    }

    async getAll(id) {
        return await networkManager
            .doRequest(`${this.route}/data`, {"id": id}, "POST");
    }

    /**
     * async function that handles a Promise from the networkmanager
     * @param username
     * @param password
     * @returns {Promise<user>}
     */
    async login(username, password) {
        return await networkManager
            .doRequest(`${this.route}/login`, {"username": username, "password": password}, "POST");
    }

    async delete(id) {
        return await networkManager
            .doRequest(`${this.route}/delete`, {"id": id});
    }


    async register(username, password) {

    }

    async update(id, editValues) {
        return await networkManager
            .doRequest(`${this.route}/update`, {"id": id, "editValues": editValues});
    }

    // Adds a rehibalitant
    async addPatient(insertValues) {
        return await networkManager
            .doRequest(`${this.route}/add`, {"insertValues": insertValues});
    }

    async getRehabilitatorInfo(id) {
        return await networkManager
            .doRequest(`${this.route}/rehabilitator`, {"id": id}, "POST");
    }

    async getCaretakerInfo(id) {
        return await networkManager
            .doRequest(`${this.route}/caretaker`, {"id": id}, "POST");
    }

}