// passport-setup.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/user');

// passport.use(
//     new GoogleStrategy({
//         // Options for the Google strategy
//         clientID: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         callbackURL: '/auth/google/redirect'
//     }, (accessToken, refreshToken, profile, done) => {
//         // Check if user already exists in our db
//         User.findOne({ googleId: profile.id }).then((currentUser) => {
//             if (currentUser) {
//                 done(null, currentUser);
//             } else {
//                 new User({
//                     googleId: profile.id,
//                     username: profile.displayName,
//                     email: profile.emails[0].value
//                 }).save().then((newUser) => {
//                     done(null, newUser);
//                 });
//             }
//         });
//     })
// );


// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: "/auth/facebook/redirect",
//     profileFields: ['id', 'displayName', 'photos', 'email']
// }, (accessToken, refreshToken, profile, done) => {
//     User.findOne({ facebookId: profile.id }).then((currentUser) => {
//         if (currentUser) {
//             done(null, currentUser);
//         } else {
//             new User({
//                 facebookId: profile.id,
//                 username: profile.displayName,
//                 email: profile.emails[0].value
//             }).save().then((newUser) => {
//                 done(null, newUser);
//             });
//         }
//     });
// }));

// passport.use(new TwitterStrategy({
//     consumerKey: process.env.TWITTER_CONSUMER_KEY,
//     consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
//     callbackURL: "/auth/twitter/redirect"
// }, (token, tokenSecret, profile, done) => {
//     User.findOne({ twitterId: profile.id }).then((currentUser) => {
//         if (currentUser) {
//             done(null, currentUser);
//         } else {
//             new User({
//                 twitterId: profile.id,
//                 username: profile.displayName,
//                 // Twitter does not necessarily provide email, handle accordingly
//             }).save().then((newUser) => {
//                 done(null, newUser);
//             });
//         }
//     });
// }));

// passport.use(new DiscordStrategy({
//     clientID: process.env.DISCORD_CLIENT_ID,
//     clientSecret: process.env.DISCORD_CLIENT_SECRET,
//     callbackURL: '/auth/discord/redirect',
//     scope: ['identify', 'email']  // 'identify' gets basic user information including the id, 'email' gets the user's email
// }, function(accessToken, refreshToken, profile, done) {
//     User.findOne({ discordId: profile.id }).then((currentUser) => {
//         if (currentUser) {
//             done(null, currentUser);
//         } else {
//             new User({
//                 discordId: profile.id,
//                 username: profile.username,
//                 email: profile.email  // Make sure your User model can handle these fields
//             }).save().then((newUser) => {
//                 done(null, newUser);
//             });
//         }
//     }).catch(err => done(err));
// }));

module.exports = passport;
