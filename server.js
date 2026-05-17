app.post("/api/detect-conflicts", async (req, res) => {
  const { travelers, city, dates } = req.body;

  const travelersText = travelers
    .map((t, i) => `Traveler ${i + 1} (${t.name}):
    - Vibe: ${t.vibe.join(", ")}
    - Energy level: ${t.energyLevel}
    - Day window: ${t.morningStart} → ${t.eveningEnd}
    - Budget: ${t.budget}
    - Dietary restrictions: ${t.dietaryRestrictions || "None"}
    - Physical restrictions: ${t.physicalRestrictions || "None"}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  topic: { type: "string" },
                  description: { type: "string" },
                  option_a: { type: "string" },
                  option_b: { type: "string" },
                  travelers_involved: { type: "array", items: { type: "string" } }
                },
                required: ["id", "topic", "description", "option_a", "option_b", "travelers_involved"],
                additionalProperties: false
              }
            }
          },
          required: ["conflicts"],
          additionalProperties: false
        }
      }
    },
    messages: [{
      role: "user",
      content: `You are a group trip planner analyzing preference conflicts.

Trip: ${city}, ${dates}

${travelersText}

Identify the 3-5 most significant preference conflicts that need group negotiation. Look for real tensions like:
- Mismatched energy levels or activity types (e.g. Chill vs Full throttle)
- Day schedule conflicts (one person starts late, another wants early mornings)
- Budget gaps
- Vibe mismatches (e.g. Culture vs Nightlife)
- Dietary needs that limit shared meal options

Skip trivial differences. For each conflict, propose two concrete options the group could vote on.`
    }]
  });

  const parsed = JSON.parse(response.content[0].text);
  res.json(parsed);
});
