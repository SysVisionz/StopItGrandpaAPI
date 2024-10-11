import mongoose from 'mongoose';
import { cleanObject } from '../utils';

export interface HostObj{
	address: string,
	name?: string,
	description?: string,
	reasoning?: string,
	picture?: Buffer,
	propaganda: boolean,
	toJSON: () => Partial<Pick<HostObj, 'address' | 'name' | 'description' | 'reasoning' | 'picture' | 'propaganda'>>
}

const HostSchema = new mongoose.Schema<HostObj>({
	address: {
		type: String,
		required: true
	},
	name: {
		type: String
	},
	description: {
		type: String
	},
	reasoning: {
		type: String
	},
	picture: {
		data: Buffer
	},
	propaganda: {
		type: Boolean,
		required: true
	}
}, {
	methods: {
		toJSON: function() {
			const {address, name, description, reasoning, picture, propaganda}= this;
			return cleanObject({address, name, description, reasoning, picture, propaganda})
		}
	},
	timestamps: true
})

const Host = mongoose.model('Host', HostSchema);

export default Host;