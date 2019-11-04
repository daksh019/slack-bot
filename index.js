const lodash = require('lodash');
const { WebClient } = require('@slack/web-api');
const papaparse = require('papaparse');

const express = require('express');
const server = express();


const token = "";
const idToken = "";

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
    let pmArrays = [];
    channelInfo.forEach((channel, index) => {
        channel.members = [];
        if(channel.num_members > 0){
            let pm = webBot.conversations.members({
                channel: channel.id
            });
            pmArrays.push(pm);
        } else {
            pmArrays.push(pm);
        }
    });

    const memberResults = await Promise.all(pmArrays);
    
    memberResults.forEach((result, index) => {
        const { members } = result;
        if(members && members.length > 0){
            console.log("setting all the members");
            const channel = channelInfo[index];
            channel.members = members;
            members.forEach(id => memberIds.add(id));
        }
    });
}

async function getMemberDetails(){
    
    const memberBot = new WebClient(idToken);

    let pmArray = [];
    memberIds.forEach(id => {
        pmArray.push(memberBot.users.identity({
            id
        }));
    });

    let results = await Promise.all(pmArray);
    console.log(results);

    results.forEach(result => {
        if(result.user){
            const id = result.user.id;
            memIdDetails[id] = result.user;
        }
    });

    channelInfo.forEach(channel => {
        channel.memberDetails = [];
        channel.memberEmails = [];
        channel.members.forEach(id => {
            let details = memIdDetails[id];
            if(details){
                channel.memberEmails.push(details.email);
            }
        });
    })
}

function prepareData(){
    let datapoints = ['id', 'memberEmails', 'name', 'num_members'];
    const data = channelInfo.map(info => lodash.pick(info, datapoints));
    const csvdata = papaparse.unparse(data);
    console.log(csvdata);
    return csvdata;
}


server.get('/data', async (req, res) => {
    await getAllChannels();
    await getAllMembers();
    await getMemberDetails();

    const data = prepareData();
    res.set('Content-Type', 'text/plain');
    res.end(data);
});
server.listen(3000);

console.log("get data on localhost://3000/data");