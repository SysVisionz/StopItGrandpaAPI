import mongoose from 'mongoose';

const HostSchema = new mongoose.Schema({
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
	timestamps: true
})

const Host = mongoose.model('Host', HostSchema);

export default Host;