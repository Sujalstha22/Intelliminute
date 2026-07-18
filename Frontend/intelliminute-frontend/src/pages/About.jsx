const About = () => {
  return (
    <div className="min-h-screen p-12 bg-gray-50">
      <h2 className="text-4xl font-bold text-center mb-6">
        About IntelliMinute
      </h2>
      <p className="max-w-3xl mx-auto text-gray-700 text-center">
        IntelliMinute is a hackathon-ready AI web app that converts raw meeting
        audio into structured meeting minutes. It uses custom TF-IDF algorithms
        and heuristic extraction logic to highlight summaries, key points,
        action items, participants, and decisions automatically.
      </p>
    </div>
  );
};

export default About;
