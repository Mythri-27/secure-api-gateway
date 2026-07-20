function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.slice(1).join(".") || issue.path.join("."),
                message: issue.message,
            }));

            return res.status(400).json({
                error: "Validation failed",
                details: errors,
            });
        }

        if (result.data.body) req.body = result.data.body;
        if (result.data.params) req.params = result.data.params;
        if (result.data.query) req.query = result.data.query;

        next();
    };
}

module.exports = validate;