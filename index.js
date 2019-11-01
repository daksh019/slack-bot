const { WebClient } = require('@slack/web-api');
// const token = process.env.SLACK_TOKEN;
const token = "xoxp-810010652129-817458723940-817931367952-4b90d3dd9a8ab0de130d442f32e0fbf9";
const webBot = new WebClient(token);

let channelInfo = [];
const memberIds = new Set();
const memIdDetails = {};

async function getAllChannels(nextCursor) {
    try {
        let options = nextCursor ? {cursor : nextCursor} : {};
        const response = await webBot.conversations.list(options)  
        const {channels, response_metadata } = response;
        if(channels.length){
            channelInfo = channelInfo.concat(channels);
            if(response_metadata.next_cursor){
                await getAllChannels(response_metadata.next_cursor);
            }
        }
    } catch(error){
        console.log(error);
    }
}

async function getAllMembers(){
    channelInfo.forEach(channel => {
        channel.members = [];
        if(channel.num_members > 0){
            const { members } = await webBot.conversations.members({
                channel: channel.id
            });
            console.log("logging all members");
            console.log(members.length);
            if(members.length > 0){
                console.log("setting all the members");
                channel.members = members;
                members.forEach(id => memberIds.add(id));
            } 
        }
    });
    console.log(memberIds);    
}

async function getMemberDetails(){
    memberIds.forEach(async id => {
        let member = await webBot.users.identity({
            id: members[0]
        });
        memIdDetails[id] = member;
    });
}

async function execute() {
    await getAllChannels();
    await getAllMembers();
    await getMemberDetails();
    
    console.log(channelInfo);
    console.log(memIdDetails);
}

execute();