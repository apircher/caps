define(['modules/user/entities'], function (model) {

    describe('user/entities', function () {

        it('defines a User class', function () {
            expect(model.User).toBeDefined();
        });

        describe('User Class', function () {

            describe('User.isInRole', function () {

                it('returns true if the users roles array contains the given role', function () {
                    var user = new model.User();
                    user.roles(['Administrator']);
                    expect(user.isInRole('Administrator')).toBe(true);
                });

                it('returns false if the users roles array does not contain the given role', function () {
                    var user = new model.User();
                    expect(user.isInRole('Administrator')).toBe(false);
                });

                it('throws an error if the given role is null or empty', function () {
                    var theError = new Error('The role parameter must not be null or empty');
                    var user = new model.User();
                    expect(function () {
                        user.isInRole(null);
                    })
                    .toThrow(theError);

                    expect(function () {
                        user.isInRole('');
                    })
                    .toThrow(theError);
                });

            });

            describe('User.addToRole', function () {

                it('adds the given role to the users roles array', function () {
                    var user = new model.User();
                    user.addToRole('Administrator');
                    expect(user.roles()[0]).toBe('Administrator');
                });

                it('does not add the role when the users roles array already contains the given role', function () {
                    var user = new model.User();
                    user.addToRole('Administrator');
                    user.addToRole('Honk');
                    user.addToRole('Administrator');
                    user.addToRole('Honk');
                    user.addToRole('Honk');
                    expect(user.roles().length).toBe(2);
                });

            });

            describe('User.removeFromRole', function () {

                it('removes the given role from the users roles array', function () {
                    var user = new model.User();
                    user.roles(['Administrator']);
                    user.removeFromRole('Administrator');
                    expect(user.roles().length).toBe(0);                    
                });

            });

            describe('User.toggleRole', function () {
                it('adds the given role to the users roles array if it does not already contain it', function () {
                    var user = new model.User();
                    user.toggleRole('Administrator');
                    expect(user.roles()[0]).toBe('Administrator');
                });
                it('removes the given role from the users roles array if it does contain it', function () {
                    var user = new model.User();
                    user.roles(['Administrator']);
                    user.toggleRole('Administrator');
                    expect(user.roles().length).toBe(0);
                });
            });

        });

    });

});