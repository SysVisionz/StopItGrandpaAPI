import mongoose from 'mongoose';

const SiteSchema = new mongoose.Schema({
	host: {
		type: String,
		required: true
	},
	name: {
		type: String
	},
	propagandists: 
	{
		type: Object,
		required: true
	}
}, {timestamps: true})

const Site = mongoose.model('Site', SiteSchema);

export default Site;