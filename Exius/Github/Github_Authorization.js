const {Octokit}=require("@octokit/core")
const adminKey = process.env.ADMIN_GIT_KEY
const org = process.env.GIT_ORG
async function Is_User_Valid(orgName,userKey){
    // Is_User_Valid checks to see if a user is part of an organization
    // OrgName (string) is the organization being checked, and UserKey (string)
    // is the personal key being tested. This returns true if the user is in the org
    // and false otherwise
    let orgArray=await Get_User_Orgs(userKey)
    if (orgArray.includes(orgName)){
        return true
    }
    return false
}

async function Get_User_Orgs(userKey){
    // Get_User_Orgs takes a user personal access key and gets all the organizations that
    // user is a member of. Takes in user key (string) and returns an array of orgs (string).
    const octokit=new Octokit({auth:userKey})
    try{
        let userOrgs = (await octokit.request(`GET /user/orgs`)).data
        let userOrgsFiltered=userOrgs.map(x=>x.login)
        return userOrgsFiltered
    }
    catch(e){
        console.log(e)
        console.log("Credential Error Check_User_Git_Org")
        return []
        }
}

async function Get_Member_Status(org,adminKey,username){
    const octokit=new Octokit({auth:adminKey})
    try{
        let userPermissions=await octokit.request('GET /orgs/{org}/memberships/{username}', {
            org: org,
            username: username
          })
        return userPermissions.data.role
    }
    catch(e){
        throw Error("Error in getting member status")
    }
}

async function Get_Username(userKey){
    const octokit = new Octokit({auth:userKey})
    try{
        let userData = await octokit.request("GET /user")
        return userData.data.login
    }
    catch(e){
        throw Error("Error in getting member username")
    }
}
async function Is_User_In_Org(userKey,allowedStatus=["member","admin"]){
    try{
        let username=await Get_Username(userKey)
        let userStatus=await Get_Member_Status(org,adminKey,username)
        if (allowedStatus.includes(userStatus)){
            return true
        }
        else{
            return false
        }
    }
    catch(e){
        throw Error("Error in retrieving status")
    }
}
async function Does_User_Have_Repository_Access(userKey,repo,allowedPermissions=["pull","push","admin"]){
    try{
        let username=await Get_Username(userKey)
        const octokit = new Octokit({auth:adminKey})
        let collaboratorData=await octokit.request('GET /repos/{owner}/{repo}/collaborators', {
            owner: org,
            repo: repo
          })
        collaboratorObj={}
        let logins=collaboratorData.data.map((data)=>{collaboratorObj[String(data.login)]=data.permissions})
        if (Object.keys(collaboratorObj).includes(username)){
            let permissionGranted=allowedPermissions.some((permission)=>collaboratorObj[username][permission])
            if (permissionGranted){
                return true
            }else{
                return false
            }
        }
        return false
    }
    catch(e){
        throw Error(`Issue in determining if user has access to repository: ${repo}`)
    }
}
async function tester(){
    try{
        let accessGranted=await Does_User_Have_Repository_Access("1254","NRD-Lab-test.github.io")
    }
    catch(e){
        console.log(e)
    }
}
//tester()
module.exports={
    Is_User_Valid,
    Does_User_Have_Repository_Access,
    Is_User_In_Org
}
