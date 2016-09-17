import { Mongo } from 'meteor/mongo';

export const Drones = new Mongo.Collection('drones');
export const Pods = new Mongo.Collection('pods');
export const Requests = new Mongo.Collection('requests');