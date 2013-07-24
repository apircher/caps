define(function (require) {

    var ko = require('knockout'),
        moment = require('moment'),
        authentication = require('authentication');

    //
    // Class "User".
    //
    function User(data) {

        var self = this;
        data = data || {};

        this.userName = ko.observable(data.UserName || '').extend({ required: true });
        this.password = ko.observable(data.Password || '');
        this.comment = ko.observable(data.Comment || '');
        this.creationDate = ko.observable(data.CreationDate || new Date());
        this.email = ko.observable(data.Email || '').extend({ required: true, email: true });
        this.phone = ko.observable(data.Phone || '');
        this.isApproved = ko.observable(data.IsApproved || false);
        this.isLockedOut = ko.observable(data.IsLockedOut || false);
        this.lastActivityDate = ko.observable(data.LastActivityDate);
        this.lastLockoutDate = ko.observable(data.LastLockoutDate);
        this.lastLoginDate = ko.observable(data.LastLoginDate);
        this.lastPasswordChangedDate = ko.observable(data.LastPasswordChangedDate);

        this.firstName = ko.observable(data.FirstName || '').extend({ required: true });
        this.lastName = ko.observable(data.LastName || '').extend({ required: true });

        this.roles = ko.observableArray(data.Roles || []);
        
        this.isOnline = ko.computed(function () {
            if (!self.lastActivityDate())
                return false;
            return moment() <= moment(self.lastActivityDate()).add('minutes', 15);
        });

        this.hasEverLoggedIn = ko.computed(function () {
            return self.lastLoginDate() > self.creationDate();
        });
        this.lastLoginDateFormatted = ko.computed(function () {
            if (!self.hasEverLoggedIn()) return 'noch nie';
            return moment(self.lastLoginDate()).fromNow();
        });
        this.lastActivityDateFormatted = ko.computed(function () {
            if (!self.hasEverLoggedIn()) return 'noch nie';
            return moment(self.lastActivityDate()).subtract('seconds', 20).fromNow();
        });

        this.hasEverBeenLockedOut = ko.computed(function () {
            return self.lastLockoutDate() > self.creationDate();
        });
        this.lastLockoutDateFormatted = ko.computed(function () {
            if (!self.hasEverBeenLockedOut()) return 'noch nie';
            return moment(self.lastLockoutDate()).fromNow();
        });

        this.hasEverChangedPassword = ko.computed(function () {
            return self.lastPasswordChangedDate() > self.creationDate();
        });
        this.lastPasswordChangedDateFormatted = ko.computed(function () {
            if (!self.hasEverChangedPassword()) return 'noch nie';
            return moment(self.lastPasswordChangedDate()).fromNow();
        });

        this.isEffectivelyLockedOut = ko.computed(function () {
            if (self.isLockedOut()) {
                var d = moment(self.lastLockoutDate()).add('minutes', authentication.metadata.lockoutPeriod);
                return d > new Date();
            }
            return false;
        });

        this.displayName = ko.computed(function () {
            if (self.firstName().length > 0)
                return self.firstName();
            else if (self.lastName().length > 0)
                return self.lastName();
            else
                return self.userName();
        });

        this.fullName = ko.computed(function () {
            var full = '{0} {1}'
                .replace(/\{0\}/, self.firstName())
                .replace(/\{1\}/, self.lastName()).trim();
            return full.length ? full : self.userName();
        });

        this.hasPhone = ko.computed(function () {
            return self.phone().length > 0;
        });

        ko.validation.group(this);
    }

    User.prototype.refresh = function (data) {
        data = data || {};

        this.comment(data.Comment || '');
        this.creationDate(data.CreationDate || new Date());
        this.email(data.Email || '');
        this.isApproved(data.IsApproved || false);
        this.isLockedOut(data.IsLockedOut || false);
        this.lastActivityDate(data.LastActivityDate);
        this.lastLockoutDate(data.LastLockoutDate);
        this.lastLoginDate(data.LastLoginDate);
        this.lastPasswordChangedDate(data.LastPasswordChangedDate);
        this.firstName(data.FirstName || '');
        this.lastName(data.LastName || '');
    };

    User.prototype.toDto = function () {
        var dto = {
            UserName: this.userName(),
            Password: this.password(),
            Comment: this.comment(),
            Email: this.email(),
            Roles: this.roles(),
            FirstName: this.firstName(),
            LastName: this.lastName(),
            Phone: this.phone()
        };
        return dto;
    };

    User.prototype.isInRole = function (role) {
        if (!role || !role.length)
            throw Error('The role parameter must not be null or empty');

        if (this.roles() && this.roles().length) {
            for (var i = 0; i < this.roles().length; i++) {
                if (role == this.roles()[i]) return true;
            }
        }

        return false;
    };

    User.prototype.addToRole = function (role) {
        if (!this.isInRole(role)) this.roles.push(role);
    };

    User.prototype.removeFromRole = function (role) {
        if (this.isInRole(role)) this.roles.remove(role);
    };

    User.prototype.toggleRole = function (role) {
        if (this.isInRole(role)) this.removeFromRole(role);
        else this.addToRole(role);
    };

    return {
        User: User
    };

});