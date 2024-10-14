import { ObjectId } from 'mongodb'
import { FlatRecord, Schema, Document, Model } from 'mongoose'

interface Host {

}

interface Site {

}

interface Propagandist {

}

export interface SubmissionObj extends Document{
	_id: ObjectId,
	user: ObjectId,
	type: 'host' | 'site' | 'propagandist'
}

interface SubmissionMethods {
}

type QueryReturn = Promise<
  (Document<ObjectId, {}, FlatRecord<SubmissionObj>> &
    FlatRecord<SubmissionObj> &
    Required<{ _id: ObjectId }> & { __v?: number | undefined })
>;

interface QueryHelpers {
}

const SubmissionSchema = new Schema<
SubmissionObj, 
Model<SubmissionObj>,
SubmissionMethods,
{},
{},
QueryHelpers
>({
	user: ObjectId,

}, {
	methods: {
		toJSON: function() {
			switch(this.type){
				case "host":
					return {}
				case "site":
					return {}
				case "propagandist":
					return {}
			}
		}
	},
	statics: {
		submit<T extends 'host'|'site'|'propagandist' = 'host'|'site'|'propagandist'>(type: T, data: T extends "host" ? Host : T extends "site" ? Site : T extends "propagandist" ? Propagandist : never ){
			switch (type){
				case 'host':
				case 'site':
				case 'propagandist':
			}
		}
	},
	timestamps: true
})