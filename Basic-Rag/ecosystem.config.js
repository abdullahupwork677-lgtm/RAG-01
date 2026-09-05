GPUShaderModule.exports = {
    apps: [
        {
            name: "rag-backend",
            script: "uvicorn",
            args: "main:app --host 31.97.136.149 --port 3002",
            interpreter: "/var/www/nextjs-RAG/Basic-Rag/env/bin/python3",
            cwd: "/var/www/nextjs-RAG/Basic-Rag",
        }
    ]
};