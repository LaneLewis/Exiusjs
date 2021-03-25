# Exius
Exius is a niche dockerized web api that allows users to make controlled web endpoints for uploading data. It was specifically built to handle uploads from insecure locations such as static, public websites that need a lot of specificity in what a client should be able to upload. 
How the system works works:
* A github organization admin creates an instance of Exius on a web server and binds it to their organization. They also set who can create endpoints to box within their organization and the base folder in box that members can upload to.
* Organization members with the specified credentials then can create Template Keys, which create a set of form data upload endpoints to a specific box folder and is tied to a repository. Within the template key, they can give highly specific limitations on what can be uploaded such as file types, number of files, max number of file updates, ect. In addition, they can protect it with a password and specify the number of Write Keys that the Template Key can create.
* Clients then can request Write Keys by submitting a Template Key and the requisite password. If valid, it will create a Write Key drawn from the the Template Key parameters with all the limitations of that specific Template Key. The Write Key number is then passed to the client.
* The client can then upload files to Exius with the Write Key. Everytime that an upload is attempted with a Write Key, the state of the Write Key is updated to account for the number of files uploaded, what the files were ect. If an upload is attempted beyond the scope of the Write Key, it fails.
* Github users with access to the specific repository tied to the Template Key can then view the data uploaded to that particular box folder as well as manage the Template Key and all its children Write Keys.


Exius's primary use case is to be the backend storage system for the in-development psychology experiment platform, PsychoSite.
