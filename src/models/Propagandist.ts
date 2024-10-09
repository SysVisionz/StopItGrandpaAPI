import mongoose from 'mongoose';

const PropagandistSchema = new mongoose.Schema({
	address: {
		type: String,
		required: true
	},
	name: {
		type: String,
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
	site: {
		type: String,
		required: true
	}
}, {timestamps: true})

const Propagandist = mongoose.model('Propagandist', PropagandistSchema);

export default Propagandist;