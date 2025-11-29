export const validateRequest = (schemas) => (req, res, next) => {
    const partsToValidate = [
        ['body', req.body],
        ['query', req.query],
        ['params', req.params],
    ];
    for (const [key, value] of partsToValidate) {
        if (schemas[key]) {
            const { error } = schemas[key].validate(value, { abortEarly: false });
            if (error) {
                const messages = error.details.map((d) => d.message).join(', ');
                return res.status(400).json({ success: false, message: messages });
            }
        }
    }
    next();
};
