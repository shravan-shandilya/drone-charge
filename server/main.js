import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
});
drones = new Mongo.Collection('drones');
pods = new Mongo.Collection('pods');

