define([
    'modules/user/commands/deleteUser', 'modules/user/entities', 'authentication', 'modules/user/datacontext', 'plugins/dialog', 'Q'
], function (deleteUserCommand, model, authentication, datacontext, dialog, Q) {

    describe('deleteUser command', function () {

        var testUser;

        beforeEach(function () {
            authentication.user(new authentication.UserModel(true, 'John.Doe', ['Administrator']));
            testUser = new model.User({
                UserName: 'John.Doe'
            });
        });

        it('rejects when the authenticated user tries to delete himself', function () {
            var flag = false;
            var rejected = false;

            spyOn(dialog, 'showMessage').andCallFake(function () {
                var deferred = Q.defer();
                deferred.resolve();
                return deferred.promise;
            });

            runs(function () {
                deleteUserCommand.execute(testUser).fail(function () {
                    rejected = true;
                })
                .done(function () {
                    flag = true;
                });
            });

            waitsFor(function () {
                return flag;
            }, 'execute to complete', 500);

            runs(function () {
                expect(rejected).toBe(true);
            });

        });

        it('does not call datacontext.deleteUser when the authenticated user tries to delete himself', function () {
            var flag = false;

            spyOn(dialog, 'showMessage').andCallFake(function () {
                var deferred = Q.defer();
                deferred.resolve();
                return deferred.promise;
            });

            spyOn(datacontext, 'deleteUser');

            runs(function () {
                deleteUserCommand.execute(testUser)
                    .fail(function () {
                    })
                    .done(function () {
                        flag = true;
                    });
            });

            waitsFor(function () {
                return flag;
            }, 'execute to complete', 500);

            runs(function () {
                expect(datacontext.deleteUser).not.toHaveBeenCalled();
            });
        });

    });

});