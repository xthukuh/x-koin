export default function Problem() {
  return (
    <section className="xk-section" id="problem">
      <div className="xk-wrap">
        <p className="xk-eyebrow">02 / the problem, in Nairobi</p>
        <h2>Fibre stops at the gate. The wiring goes all the way in.</h2>
        <div className="xk-cols">
          <p>
            Stand on Kangundo Road in Githurai 45, or in a rental block off Pipeline in Embakasi, or
            in a corridor of Kawangware, and the pattern repeats. A trunk cable runs past the
            junction. Getting from that cable into forty flats means a contract per flat, a router
            per flat, and a technician who has to be let into every one of them. So the last two
            hundred metres never happen, and the tenants buy mobile data instead, a bundle at a time,
            for a phone that is also the family television.
          </p>
          <p>
            Every one of those buildings already has a copper network running to every room, paid for
            by the landlord decades ago and inspected by an electrician. HomePlug AV turns that
            wiring into an Ethernet bridge at roughly 10 Mbps, and a narrowband module on the same
            pair carries control traffic at about 960 bytes a second. The physical layer to the door
            of every flat is installed. What has been missing is a way to meter and pay for what
            crosses it, without a billing department.
          </p>
          <p>
            We are not going to quote you a price per gigabyte in Eastleigh, because we have not
            measured one. The per-unit price is deferred until it clears measured backhaul cost, and
            a 500 uKES placeholder for each 10 KB unit, which is 0.05 KES per megabyte, stands in
            everywhere the code needs a number. The payback figures in the financial model are
            conditional on that measurement and are not quoted here without it. What the protocol
            does fix is the part that does not depend on a price: the operator keeps 95 percent of
            whatever the byte earns, and gets it without trusting anyone.
          </p>
        </div>
      </div>
    </section>
  );
}
