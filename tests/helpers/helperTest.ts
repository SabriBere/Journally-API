export const initialUsers = [
    {
        name: "Ana Test",
        email: "ana@example.test",
        password: "AnaTest123!",
    },
    {
        name: "Bruno Test",
        email: "bruno@example.test",
        password: "BrunoTest123!",
    },
    {
        name: "Carla Test",
        email: "carla@example.test",
        password: "CarlaTest123!",
    },
];

export const initPost = [
    {
        title: "My first journal entry",
        description: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Today was a productive day.",
                        },
                    ],
                },
            ],
        },
    },
    {
        title: "Things I am grateful for",
        description: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Family, friends, and good health.",
                        },
                    ],
                },
            ],
        },
    },
    {
        title: "Plans for tomorrow",
        description: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Finish the API tests and go for a walk.",
                        },
                    ],
                },
            ],
        },
    },
];
