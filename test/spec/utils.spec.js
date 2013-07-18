define(['infrastructure/utils'], function (utils) {

    describe('utils', function () {

        it('defines a compareArrays-Function', function () {
            expect(utils.compareArrays).toBeDefined();
        });

        describe('compareArrays', function () {

            it('returns true when two arrays with equal values are provided', function () {
                var a1 = [1, 2, 3];
                var a2 = [1, 2, 3];
                var result = utils.compareArrays(a1, a2);
                expect(result).toBe(true);
            });

            it('returns false when two arrays are provided, that do not contain equal values', function () {
                var a1 = [1, 2, 3];
                var a2 = [1, 2, 4];
                var result = utils.compareArrays(a1, a2);
                expect(result).toBe(false);
            });

            it('returns false when two arrays with different length are provided', function () {
                var a1 = [1, 2, 3];
                var a2 = [1, 2];
                var result = utils.compareArrays(a1, a2);
                expect(result).toBe(false);
            });

            it('returns false when one of the arguments is falsey', function () {
                var a1 = null;
                var a2 = undefined;
                var result = utils.compareArrays(a1, a2);
                expect(result).toBe(false);
            });

        });

    });

});