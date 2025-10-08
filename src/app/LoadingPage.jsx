// --- Komponen Loading ---
export default function LoadingScreen () { 
    return(
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
}