const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')

const UserSchema = new Schema(
	{
		email: {
			type: String,
			lowercase: true,
			match: [/\S+@\S+\.\S+/, 'is invalid'],
			required: [true, "can't be blank"],
			unique: true,
		},
		phone: {
			type: String,
			required: [true, "can't be blank"],
			unique: true,
		},
		password: {
			type: String,
			required: [true, "can't be blank"],
		},
		is2FA: {
			type: Boolean,
			default: false,
		},
		secret2FA: {
			type: String,
		},
		session: {
			type: String,
			default: null,
		},
		amount: {
			type: Number,
			min: 0,
			default: 0,
		},
		errorPass: {
			type: Number,
			min: 0,
			default: 0,
		},
		errorBlock: {
			type: Number,
			min: 0,
			default: 0,
		},
		block: {
			type: Boolean,
			default: false,
		},
		roles: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		lastLogin: {
			type: Date,
		},
		decks: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Deck',
			},
		],
		banks: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Bank',
			},
		],
	},
	{ timestamps: true }
)

UserSchema.pre('save', async function (next) {
	try {
		if (this.isNew) {
			//Generate a salt
			const salt = await bcrypt.genSalt(10)
			//Generate a password hash (salt + password)
			const passwordHashed = await bcrypt.hash(this.password, salt)
			//Re-assign passwod hashed
			this.password = passwordHashed
		}
		next()
	} catch (error) {
		next(error)
	}
})
UserSchema.methods.isChangePassword = async function (newPassword) {
	try {
		const salt = await bcrypt.genSalt(10)
		//Generate a password hash (salt + password)
		const passwordHashed = await bcrypt.hash(newPassword, salt)
		//Re-assign passwod hashed
		return passwordHashed
	} catch (error) {
		throw new Error(error)
	}
}

UserSchema.methods.isValidPassword = async function (newPassword) {
	try {
		return await bcrypt.compare(newPassword, this.password)
	} catch (error) {
		throw new Error(error)
	}
}

const User = mongoose.model('User', UserSchema)
module.exports = User
