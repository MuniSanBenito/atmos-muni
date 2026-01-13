import config from '@payload-config'
import { getPayload } from 'payload'

const seed = async () => {
  // Get a local copy of Payload by passing your config
  const payload = await getPayload({ config })

  const solicitudes = await payload.find({
    collection: 'solicitudes',
    pagination: false,
    where: { fechaSolicitud: { equals: null } },
  })

  console.log(`Found ${solicitudes.totalDocs} solicitudes without fechaSolicitud`)

  console.log(solicitudes.docs)

  /* const solicitud = solicitudes.docs.at(0)
  if (solicitud) {
    console.log('Example solicitud without fechaSolicitud:', solicitud)
    await payload.update({
      collection: 'solicitudes',
      id: solicitud.id,
      data: {
        fechaSolicitud: solicitud.createdAt,
      },
    })
  } */

  for (const solicitud of solicitudes.docs) {
    await payload.update({
      collection: 'solicitudes',
      id: solicitud.id,
      data: {
        fechaSolicitud: solicitud.createdAt,
      },
    })
    console.log(`Updated solicitud ${solicitud.id} with fechaSolicitud ${solicitud.createdAt}`)
  }
}

// Call the function here to run your seed script
await seed()
