import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// 样式定义
const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: '#ffffff',
    },
    card: {
        width: 200,
        height: 300,
        border: '4pt solid #e2e8f0',
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
        margin: 10,
    },
    header: {
        height: 40,
        backgroundColor: '#2563eb', // 默认蓝色
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
    },
    headerText: {
        color: '#ffffff',
        fontSize: 6,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    body: {
        padding: 15,
        alignItems: 'center',
    },
    photo: {
        width: 80,
        height: 100,
        backgroundColor: '#f1f5f9',
        borderRadius: 5,
        marginBottom: 10,
        border: '1pt solid #cbd5e1',
    },
    name: {
        fontSize: 14,
        fontWeight: 'black',
        marginBottom: 2,
        color: '#0f172a',
    },
    org: {
        fontSize: 8,
        color: '#64748b',
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    infoContainer: {
        width: '100%',
        borderTop: '0.5pt solid #f1f5f9',
        borderBottom: '0.5pt solid #f1f5f9',
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    infoBox: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 5,
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 8,
        fontWeight: 'black',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 20,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'black',
        letterSpacing: 2,
    }
});

interface Person {
    full_name: string;
    organization: string;
    photo_url?: string;
    function: string;
    role_code: string;
    color?: string;
}

export const AccreditationDocument = ({ people }: { people: Person[] }) => (
    <Document>
        <Page size="A4" style={styles.page} wrap>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {people.map((person, i) => (
                    <View key={i} style={styles.card}>
                        {/* Header */}
                        <View style={[styles.header, { backgroundColor: person.color || '#2563eb' }]}>
                            <Text style={styles.headerText}>2025 NATIONAL UNIVERSITY CYCLING CHAMPIONSHIP</Text>
                        </View>

                        {/* Body */}
                        <View style={styles.body}>
                            {person.photo_url ? (
                                /* eslint-disable-next-line jsx-a11y/alt-text */
                                <Image src={person.photo_url} style={styles.photo} />
                            ) : (
                                <View style={styles.photo} />
                            )}

                            <Text style={styles.name}>{person.full_name}</Text>
                            <Text style={styles.org}>{person.organization}</Text>

                            <View style={styles.infoContainer}>
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Role</Text>
                                    <Text style={styles.infoValue}>{person.function}</Text>
                                </View>
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Zone</Text>
                                    <Text style={styles.infoValue}>ALL</Text>
                                </View>
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={[styles.footer, { backgroundColor: person.color || '#2563eb' }]}>
                            <Text style={styles.footerText}>{person.role_code}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);
