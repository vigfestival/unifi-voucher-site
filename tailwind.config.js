module.exports = {
    mode: 'jit',
    content: ["./template/**/*.{html,js,ejs}"],
    darkMode: 'media',
    theme: {
        extend: {}
    },
    variants: {
        extend: {}
    },
    plugins: [
        require("tailwindcss-text-fill")
    ]
};
