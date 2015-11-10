module.exports = {
    jwt: {
        expires_in_seconds: 604800, // 1 week = 604800
        issuer: process.env.JOUMAE_USERS_JWT_ISSUER,
        secret: process.env.JOUMAE_USERS_JWT_SECRET
    },

    jaws: {
        stage: process.env.JAWS_STAGE || 'dev',
        data_model_stage: process.env.JAWS_DATA_MODEL_STAGE || 'dev'
    }
};
